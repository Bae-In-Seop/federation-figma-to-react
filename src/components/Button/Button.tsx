import React from 'react';
import styles from './Button.module.css';

export const Button = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={styles.base} {...props}>
      <div className={styles.button}>
        <div className={styles.stateLayer}>
          <span className={styles.labelText}>Label</span>
        </div>
      </div>
    </div>
  );
};
