import * as React from 'react';
import {StatusMode} from "@/components/graphSection/model/StatusMode";
import {SelectionInspector} from "@/components/graphSection/model/SelectionInspector";
import {go} from "gojs/projects/maximalSource/maximal-index";
import {InfoEventsServices} from "@/components/graphSection/model/InfoEventServices";
import {InfoEventTransitionAndSetters} from '@/components/graphSection/model/InfoEventTransitionAndSetters'
import {InfoTimers} from '@/components/graphSection/index'
import {Scenario} from "@/src/types/JsonScenario";
import {JSONScenario} from "@/src/types/JsonScenario"



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
      <InfoTimers infoEvent={divInfoEvent} json={json} currentState={currentState}/>
      <InfoEventTransitionAndSetters infoEvent={divInfoEvent}
                                          json={json}
                                          currentState={currentState}
                                          currentMode={mode}/>
    </div>
  );
}