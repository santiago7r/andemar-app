import type { CSSProperties } from 'react';

// Estilos compartidos por los formularios de cuenta y administración
export const inputStyle: CSSProperties = {
  width: '100%',
  padding: 10,
  marginBottom: 12,
  borderRadius: 10,
  border: '1px solid var(--surface-200)',
  fontSize: 14,
  background: '#fff',
};

export const labelStyle: CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: 13,
  marginBottom: 4,
};

export const buttonStyle: CSSProperties = {
  background: 'var(--brand)',
  color: '#fff',
  border: 'none',
  padding: '12px 20px',
  borderRadius: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export const outlineButtonStyle: CSSProperties = {
  background: 'transparent',
  color: 'var(--brand)',
  border: '1.5px solid var(--brand)',
  padding: '10px 18px',
  borderRadius: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export const cardStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid var(--surface-200)',
  borderRadius: 18,
  padding: 18,
};
