import * as React from 'react';
import {Block} from '@/components/graphSection/model/Block'
import {Scenario} from "@/src/types/JsonScenario";
import styles from './InfoEventTransitionAndSetters.module.css';
import {JSONScenario} from "@/src/types/JsonScenario";


interface MyProps {
  infoEvent: Scenario | null,
  json: JSONScenario,
  currentState: number | undefined
  currentMode: number

}

export function InfoEventTransitionAndSetters(props: React.PropsWithChildren<MyProps>) {
  let infoEvent = props.infoEvent;
  let transitionArray = infoEvent?.actions?.find((elem) =>
    elem.state == props.currentState)?.commands?.filter((elem) => elem.hasOwnProperty("set_state"))
  let transition: number | undefined;
  if (transitionArray?.length == 0 || !transitionArray) {
    transition = infoEvent?.actions?.find((elem) => elem.state == props.currentState)?.set_state
  } else {
    transition = transitionArray?.find((elem) => (elem.pay_mode == props.currentMode))?.set_state
  }
  let mode = infoEvent?.actions?.find((elem) =>
    elem.state == props.currentState)?.set_pay_mode
  let data = infoEvent?.actions?.find((elem) =>
    elem.state == props.currentState)?.set_data_store
  return (
    <Block className={styles.modelInfoEventTransitionSetMode} hidden={(transition == null && mode == undefined)}>
      <div>
        <li style={{color: "darkgreen"}} hidden={transition == null}>Переход в состояние {transition} - {
          props.json?.states.find((elem) => (elem.id == transition))?.name}</li>
        <li style={{color: "darkviolet"}} hidden={!mode}>Установить mode {mode} - {props.json?.pay_modes.find(
          (el) => el.id === mode)?.description}</li>
        <li style={{color: "darkslateblue"}} hidden={!data}>Сохранить {props.json?.data_stores.find(
          (el) => el.id === data)?.description}</li>
      </div>
    </Block>
  );
}