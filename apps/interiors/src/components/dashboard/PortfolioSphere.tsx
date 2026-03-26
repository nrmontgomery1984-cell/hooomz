import { Sphere } from '../sphere';

interface PortfolioSphereProps {
  /** Portfolio health score (0-100) */
  score?: number | null;
  /** Click handler to view portfolio details */
  onClick?: () => void;
}

/**
 * PortfolioSphere - Large central sphere showing aggregate portfolio health
 */
export function PortfolioSphere({ score, onClick }: PortfolioSphereProps) {
  return (
    <div className="flex flex-col items-center py-8">
      <Sphere
        score={score}
        size={160}
        label="Portfolio"
        onClick={onClick}
        showScore={true}
      />
    </div>
  );
}

export default PortfolioSphere;
