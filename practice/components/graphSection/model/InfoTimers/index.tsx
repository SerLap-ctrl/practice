import * as React from 'react';
import {Block} from '@/components/graphSection/model/Block'
import {Scenario} from "@/src/types/JsonScenario";
import styles from './InfoTimers.module.css'
import {JSONScenario} from "@/src/types/JsonScenario";

interface MyProps {
  infoEvent: Scenario | null,
  json: JSONScenario,
  currentState: number | undefined

}

export function InfoTimers(props: React.PropsWithChildren<MyProps>) {
  const infoEvent = props.infoEvent;
  const action = infoEvent?.actions?.find((elem) =>
    elem.state == props.currentState)
  let arrayTimers = Array()
  if (action?.start_timer) {
    arrayTimers.push({start_timer: action.start_timer})
  }
  if (action?.stop_timer) {
    arrayTimers.push({stop_timer: action.stop_timer})
  }
  const timers = props.json?.timers

  return (
    <Block className={styles.modelInfoTimers} hidden={!(arrayTimers)}>
      <div style={{margin: "0px"}}>{arrayTimers ? arrayTimers.map((elem, index) =>
        <div className={styles.modelInfoTimer} key={index} style={{
          color: "blue"
        }}>{elem.start_timer ? "Запустить таймер№ " + elem.start_timer : elem.stop_timer ? "Остановить таймер№ "
          + elem.stop_timer : null}
          <li>Название: {timers?.find((el) =>
            el.id == elem?.start_timer ?
              elem.start_timer : elem?.stop_timer ?
                elem.stop_timer : null)?.name}</li>
          <li>Описание: {timers?.find((el) =>
            el.id == elem?.start_timer ?
              elem.start_timer : elem?.stop_timer ?
                elem.stop_timer : null)?.description}</li>
          <li>Истекающие событие: {timers?.find((el) =>
            el.id == (elem?.start_timer ?
              elem.start_timer : elem?.stop_timer ?
                elem.stop_timer : null))?.expire_event}</li>
          <li>Ожидание: {timers?.find((el) =>
            el.id == (elem?.start_timer ?
              elem.start_timer : elem?.stop_timer ?
                elem.stop_timer : null))?.timeout} секунд
          </li>
        </div>
      ) : null}</div>
    </Block>
  );
}