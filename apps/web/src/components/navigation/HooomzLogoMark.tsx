/**
 * Hooomz Logo — H + three coloured O's + MZ in white Figtree 800.
 */

export function HooomzLogoMark() {
  return (
    <span
      style={{
        fontFamily: "'Figtree', sans-serif",
        fontSize: 20,
        fontWeight: 800,
        color: '#ffffff',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      H
      <span style={{ color: '#DC2626' }}>O</span>
      <span style={{ color: '#D97706' }}>O</span>
      <span style={{ color: '#16A34A' }}>O</span>
      MZ
    </span>
  );
}
