import * as React from 'react';
import {Block} from '@/components/graphSection/model/Block'
import {Scenario} from "@/src/types/JsonScenario";
import styles from './InfoEventsServices.module.css'
import {JSONScenario} from "@/src/types/JsonScenario"


interface MyProps {
  infoEvent: Scenario | null,
  json: JSONScenario,
  currentState: number | undefined

}

export function InfoEventsServices(props: React.PropsWithChildren<MyProps>) {
  const infoEvent = props.infoEvent;
  const commands = infoEvent?.actions?.find((elem) =>
    elem.state == props.currentState)?.commands


  return (
    <Block className={styles.modelInfoEventServices} hidden={!commands}>
      <div style={{margin: "0px"}}>{commands ? commands.map((elem, index) =>
        <div className={styles.modelInfoEventService} key={index} style={{
          color: "darkred"
        }}>Отправить событие №{elem?.event ?
          elem?.event : infoEvent.event} -
          «{props.json?.events.find((el) =>
            el.id == (elem?.event ? elem.event : infoEvent.event))?.description}»
          сервису №{elem.service}
          <li style={{color: "black"}} hidden={!elem?.wait_result}>Ожидать результат выполнения
            сервиса: {elem?.wait_result ? "Да" : "Нет"}</li>
          <li style={{color: "black"}} hidden={!elem?.wait_timeout}>Ждать в
            течение {elem.wait_timeout} секунд
          </li>
        </div>
      ) : null}</div>
    </Block>
  );
}