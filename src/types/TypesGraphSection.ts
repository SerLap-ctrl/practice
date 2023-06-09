export interface NodeType {
    key: number,
    text: string | undefined,
    description: string,
}

export type NodeTypeWithRang = {
    key: number,
    text: string | undefined,
    description: string,
    rang:number
}

export interface NodeTypeWithPosColorStroke {
    key: number,
    text: string | undefined,
    description: string,
    from?: number,
    to?: number,
    pos: string,
    color: string,
    stroke: string,
}

export interface DataNodeType{
    key: number,
    text: string | undefined,
    description?: string,
    from?: number,
    to?: number,
    pos?: string,
    color?: string,
    stroke?: string,
    rang?:number
}


export type ArrayTextType = {
    text?: string,
    key?: number,
}

export type DataLinksType = {
    from: number,
    to: number,
    text?: string,
    info?: string[]
}

export type Counts = {
    [key: string]: number
}

export type KeyRefersToList = {
    key: number,
    listLink: number[]
}

export type ArrayEventsFromNode = {
    node: number,
    arrayEvents: string[]
}

export type JsonScenario = {
    events: Event[],
    states: State[],
    services: Service[],
    timers: Timer[],
    data_stores: Data_store[],
    pay_modes: Pay_mode[],
    scenario: Scenario[]
}

export type Event = {
    id: number,
    name: string,
    description: string
}
export type State = {
    id: number,
    name: string,
    description: string
}
export type Service = {
    id: number,
    name: string,
    description: string,
    url: string
    error_event?: number;
}
export type Timer = {
    id: number,
    timeout: number,
    name: string,
    expire_event: number,
    description: string
}
export type Data_store = {
    id: number,
    name: string,
    description: string
}
export type Pay_mode = {
    id: number,
    name: string,
    description: string
}

export type Scenario = {
    event: number,
    actions: Action[]
}
export type Action = {
    state: number,
    commands: Command[],
    set_state?: number,
    set_data_store?: number,
    set_pay_mode?: number,
    start_timer?: number,
    stop_timer?: number
}
export type Command = {
    service: number,
    wait_result?: boolean,
    wait_timeout?: number,
    pay_mode?: number,
    data_store?: number,
    event?: number,
    set_state?: number,
    start_timer?: number,
    stop_timer?: number
}

const v1 = {
    service: 2,

}

export type Link = {
    from: number,
    to: number
}