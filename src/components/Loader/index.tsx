import React from 'react';
import './style.scss';

export const Loader: React.SFC = () => {

  return (
    <div className='loader-container'>
      <div className='loader' />
    </div>
  );
}