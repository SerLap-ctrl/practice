import * as React from 'react';
import {StatusMode} from "./model/StatusModePayment";
import {SelectionInspector} from "./model/SelectionInspectorInfoNode";
import {go} from "gojs/projects/maximalSource/maximal-index";
import {InfoEventsServices} from "./model/InfoEventServices";
import {InfoEventTransitionAndSetters} from './model/InfoEventTransitionAndSetters';
import {InfoTimers} from '@/components/index';
import {Scenario} from "@/src/types/JsonScenario";
import {JSONScenario} from "@/src/types/JsonScenario";


interface Props {
  mode: number,
  selectData: go.ObjectData | null,
  divInfoEvent: Scenario | null,
  currentState: number | undefined,
  json: JSONScenario

}

export default function ModelContainer({
                                         mode,
                                         selectData,
                                         divInfoEvent,
                                         currentState,
                                         json
                                       }: Props) {


  return (
    <div className={'divComponent'}>
      <StatusMode mode={mode}/>
      <SelectionInspector selectedData={selectData}/>
      <InfoEventsServices infoEvent={divInfoEvent}
                          currentState={currentState}
                          json={json}/>
      <InfoTimers infoEvent={divInfoEvent}
                  json={json}
                  currentState={currentState}/>
      <InfoEventTransitionAndSetters infoEvent={divInfoEvent}
                                          json={json}
                                          currentState={currentState}
                                          currentMode={mode}/>
    </div>
  );
}