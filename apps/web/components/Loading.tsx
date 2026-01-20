import React from 'react';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message = '読み込み中...',
  size = 'medium',
  className = ''
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`loading ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div
        className={`${sizeClasses[size]} border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin`}
        style={{ marginBottom: '1rem' }}
      />
      {message && (
        <p style={{
          margin: 0,
          color: 'var(--text-color)',
          fontSize: size === 'small' ? '0.9rem' : '1rem'
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Loading;