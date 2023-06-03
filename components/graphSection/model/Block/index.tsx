import * as React from 'react';

import styles from './Block.module.css'

interface MyProps {
  className?: string
  hidden: boolean | undefined
}

export function Block(props: React.PropsWithChildren<MyProps>) {
  return (
    <div className={[styles.modelBlock, props.className].join(' ')}
         hidden={props.hidden}>{props.children}</div>
  );
}