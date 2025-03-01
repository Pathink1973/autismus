import React from 'react';

export const Logo: React.FC = () => {
  const handleClick = () => {
    window.location.href = '/';
  };

  return (
    <div 
      className="cursor-pointer"
      onClick={handleClick}
      role="button"
      aria-label="Voltar à página inicial"
    >
      <img 
        src="/icons/autismus-logo.svg" 
        alt="Autismus Logo" 
        className="w-[60px] h-[60px]"
      />
    </div>
  );
};
