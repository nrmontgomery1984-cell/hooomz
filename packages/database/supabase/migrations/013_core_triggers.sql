-- Migration 013: Core Triggers for Status Bubbling
-- Automatic status recalculation for loops and project health

-- Function to recalculate loop iteration status and child counts
CREATE OR REPLACE FUNCTION recalculate_loop_iteration_status()
RETURNS TRIGGER AS $$
DECLARE
  parent_record loop_iterations%ROWTYPE;
  child_counts JSONB;
  new_status loop_status;
  total_count INTEGER;
  not_started_count INTEGER;
  in_progress_count INTEGER;
  blocked_count INTEGER;
  complete_count INTEGER;
BEGIN
  -- Get counts of children by status
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE computed_status = 'not_started'),
    COUNT(*) FILTER (WHERE computed_status = 'in_progress'),
    COUNT(*) FILTER (WHERE computed_status = 'blocked'),
    COUNT(*) FILTER (WHERE computed_status = 'complete')
  INTO total_count, not_started_count, in_progress_count, blocked_count, complete_count
  FROM loop_iterations
  WHERE parent_iteration_id = NEW.parent_iteration_id;

  -- Build child counts JSON
  child_counts := jsonb_build_object(
    'total', total_count,
    'not_started', not_started_count,
    'in_progress', in_progress_count,
    'blocked', blocked_count,
    'complete', complete_count
  );

  -- Determine new status for parent
  IF blocked_count > 0 THEN
    new_status := 'blocked';
  ELSIF complete_count = total_count AND total_count > 0 THEN
    new_status := 'complete';
  ELSIF not_started_count = total_count THEN
    new_status := 'not_started';
  ELSE
    new_status := 'in_progress';
  END IF;

  -- Update parent if exists
  IF NEW.parent_iteration_id IS NOT NULL THEN
    UPDATE loop_iterations
    SET
      computed_status = new_status,
      child_counts = child_counts
    WHERE id = NEW.parent_iteration_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on loop_iterations status change
CREATE TRIGGER trigger_loop_status_bubble
  AFTER INSERT OR UPDATE OF computed_status
  ON loop_iterations
  FOR EACH ROW
  WHEN (NEW.parent_iteration_id IS NOT NULL)
  EXECUTE FUNCTION recalculate_loop_iteration_status();

-- Function to recalculate loop status from task status changes
CREATE OR REPLACE FUNCTION recalculate_loop_from_tasks()
RETURNS TRIGGER AS $$
DECLARE
  task_counts RECORD;
  new_status loop_status;
  target_loop_id UUID;
BEGIN
  -- Determine which loop iteration to update
  target_loop_id := COALESCE(NEW.loop_iteration_id, OLD.loop_iteration_id);

  -- Exit if no loop iteration
  IF target_loop_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Count tasks in this loop iteration
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'not_started') as not_started,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
    COUNT(*) FILTER (WHERE status = 'blocked') as blocked,
    COUNT(*) FILTER (WHERE status = 'complete') as complete,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
  INTO task_counts
  FROM task_instances
  WHERE loop_iteration_id = target_loop_id;

  -- Determine status (exclude cancelled from calculations)
  IF task_counts.blocked > 0 THEN
    new_status := 'blocked';
  ELSIF task_counts.complete = (task_counts.total - task_counts.cancelled)
        AND (task_counts.total - task_counts.cancelled) > 0 THEN
    new_status := 'complete';
  ELSIF task_counts.not_started = (task_counts.total - task_counts.cancelled) THEN
    new_status := 'not_started';
  ELSIF task_counts.total = 0 OR task_counts.total = task_counts.cancelled THEN
    new_status := 'not_started';
  ELSE
    new_status := 'in_progress';
  END IF;

  -- Update loop iteration
  UPDATE loop_iterations
  SET computed_status = new_status
  WHERE id = target_loop_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on task_instances status change
CREATE TRIGGER trigger_task_status_to_loop
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON task_instances
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_loop_from_tasks();

-- Function to update project health based on task blockers
CREATE OR REPLACE FUNCTION update_project_health()
RETURNS TRIGGER AS $$
DECLARE
  blocked_count INTEGER;
  overdue_count INTEGER;
  current_health project_health;
  target_project_id UUID;
BEGIN
  -- Determine which project to update
  target_project_id := COALESCE(NEW.project_id, OLD.project_id);

  -- Exit if no project
  IF target_project_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Count blocked tasks in project
  SELECT COUNT(*) INTO blocked_count
  FROM task_instances
  WHERE project_id = target_project_id AND status = 'blocked';

  -- Count overdue tasks (scheduled_end in past, not complete)
  SELECT COUNT(*) INTO overdue_count
  FROM task_instances
  WHERE project_id = target_project_id
    AND scheduled_end < CURRENT_DATE
    AND status NOT IN ('complete', 'cancelled');

  -- Determine health
  IF blocked_count > 2 OR overdue_count > 5 THEN
    current_health := 'behind';
  ELSIF blocked_count > 0 OR overdue_count > 0 THEN
    current_health := 'at_risk';
  ELSE
    current_health := 'on_track';
  END IF;

  -- Update project health
  UPDATE projects
  SET health = current_health, updated_at = NOW()
  WHERE id = target_project_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on task status changes affecting project health
CREATE TRIGGER trigger_project_health_update
  AFTER INSERT OR UPDATE OF status, scheduled_end OR DELETE
  ON task_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_project_health();
