import * as React from 'react';
import {Block} from '../Block'
import styles from './StatusMode.module.css'

interface MyProps {
  mode: number

}

export function StatusMode(props: React.PropsWithChildren<MyProps>) {
  return (
    <Block className={styles.modeStatusCard} hidden={false}>
      <div>текущий mode: {props.mode}</div>
    </Block>
  );
}