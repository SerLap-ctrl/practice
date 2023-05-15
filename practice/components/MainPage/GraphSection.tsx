import * as go from 'gojs';
// @ts-ignore
import {produce} from 'immer';
import * as React from 'react';

import {DiagramWrapper} from '@/components/MainPage/DiagramWrapper';
import {SelectionInspector} from '@/components/MainPage/SelectionInspector';
import scenario2 from "@/public/scenario_pre2.json";

interface AppState {
    nodeDataArray: Array<go.ObjectData>;
    linkDataArray: Array<go.ObjectData>;
    modelData: go.ObjectData;
    selectedData: go.ObjectData | null;
    skipsDiagramUpdate: boolean;
    arrayButton: any;
    divInfoEvent: any;
    divInfoMode: any;
    divInfoTimerStart: any;
    divInfoTimerStop: any;
    mode: number;
    divNodeInfo: any;
}

class App extends React.Component<{}, AppState> {
    // Maps to store key -> arr index for quick lookups
    private mapNodeKeyIdx: Map<go.Key, number>;
    private mapLinkKeyIdx: Map<go.Key, number>;
    private minSpaceBlock: number | undefined;
    private columnWidth: number | undefined = 150;
    private maxSpaceBlock: number | undefined;
    private initNodesLinks: any;
    private nodeSel: any = null;
    private jsonS: {} = {};
    // @ts-ignore
    private numberNode: number;

    constructor(props: object) {
        super(props);
        this.initNodesLinks = this.setSpace();
        this.state = {
            nodeDataArray: [
                ...this.initNodesLinks[0]
            ],
            linkDataArray: [
                ...this.initNodesLinks[1]
            ],
            modelData: {
                canRelink: true
            },
            selectedData: null,
            skipsDiagramUpdate: false,
            arrayButton: null,
            divInfoEvent: null,
            divInfoMode: null,
            divInfoTimerStart: null,
            divInfoTimerStop: null,
            mode: 0,
            divNodeInfo: null
        };

        this.mapNodeKeyIdx = new Map<go.Key, number>();
        this.mapLinkKeyIdx = new Map<go.Key, number>();
        this.refreshNodeIndex(this.state.nodeDataArray);
        this.refreshLinkIndex(this.state.linkDataArray);

        this.handleDiagramEvent = this.handleDiagramEvent.bind(this);
        this.handleModelChange = this.handleModelChange.bind(this);
        this.handleInputChange = this.handleInputChange.bind(this);
        this.deleteInfoEvent = this.deleteInfoEvent.bind(this);
        this.minSpaceBlock = 100;
    }

    private refreshNodeIndex(nodeArr: Array<go.ObjectData>) {
        this.mapNodeKeyIdx.clear();
        nodeArr.forEach((n: go.ObjectData, idx: number) => {
            this.mapNodeKeyIdx.set(n.key, idx);
        });
    }

    private refreshLinkIndex(linkArr: Array<go.ObjectData>) {
        this.mapLinkKeyIdx.clear();
        linkArr.forEach((l: go.ObjectData, idx: number) => {
            this.mapLinkKeyIdx.set(l.key, idx);
        });
    }

    public handleDiagramEvent(e: go.DiagramEvent) {
        const name = e.name;
        switch (name) {
            case 'ChangedSelection': {
                const sel = e.subject.first();
                this.setState(
                    produce((draft: AppState) => {
                        if (sel) {
                            if (sel instanceof go.Node) {
                                this.numberNode = sel.key;
                                const idx = this.mapNodeKeyIdx.get(sel.key);

                                //console.log(draft.arrayButton)
                                this.nodeSel = sel.diagram;
                                let nds = sel.findLinksOutOf()
                                let i = 0;
                                // @ts-ignore
                                let ar = [];
                                // @ts-ignore
                                draft.arrayButton = ar;
                                while (nds.count >= i) {
                                    let eventsArr = nds.value?.data.info
                                    let nodeKey = nds.value?.toNode?.data.key
                                    if (eventsArr != undefined) {
                                        ar.push({node: nodeKey, arr: eventsArr})
                                    }
                                    nds.next()
                                    i += 1
                                }

                                if (idx !== undefined && idx >= 0) {
                                    const nd = draft.nodeDataArray[idx];
                                    draft.selectedData = nd;
                                }
                            } else if (sel instanceof go.Link) {
                                const idx = this.mapLinkKeyIdx.get(sel.key);
                                if (idx !== undefined && idx >= 0) {
                                    const ld = draft.linkDataArray[idx];
                                    draft.selectedData = ld;
                                }
                            }
                        } else {
                            draft.selectedData = null;
                        }
                    })
                );
                break;
            }
            default:
                break;
        }
    }


    public handleModelChange(obj: go.IncrementalData) {
        const insertedNodeKeys = obj.insertedNodeKeys;
        const modifiedNodeData = obj.modifiedNodeData;
        const removedNodeKeys = obj.removedNodeKeys;
        const insertedLinkKeys = obj.insertedLinkKeys;
        const modifiedLinkData = obj.modifiedLinkData;
        const removedLinkKeys = obj.removedLinkKeys;
        const modifiedModelData = obj.modelData;


        const modifiedNodeMap = new Map<go.Key, go.ObjectData>();
        const modifiedLinkMap = new Map<go.Key, go.ObjectData>();
        this.setState(
            produce((draft: AppState) => {
                let narr = draft.nodeDataArray;
                if (modifiedNodeData) {
                    modifiedNodeData.forEach((nd: go.ObjectData) => {
                        modifiedNodeMap.set(nd.key, nd);
                        const idx = this.mapNodeKeyIdx.get(nd.key);
                        if (idx !== undefined && idx >= 0) {
                            narr[idx] = nd;
                            if (draft.selectedData && draft.selectedData.key === nd.key) {
                                draft.selectedData = nd;
                            }
                        }
                    });
                }
                if (insertedNodeKeys) {
                    insertedNodeKeys.forEach((key: go.Key) => {
                        const nd = modifiedNodeMap.get(key);
                        const idx = this.mapNodeKeyIdx.get(key);
                        if (nd && idx === undefined) {
                            this.mapNodeKeyIdx.set(nd.key, narr.length);
                            narr.push(nd);
                        }
                    });
                }
                if (removedNodeKeys) {
                    narr = narr.filter((nd: go.ObjectData) => {
                        if (removedNodeKeys.includes(nd.key)) {
                            return false;
                        }
                        return true;
                    });
                    draft.nodeDataArray = narr;
                    this.refreshNodeIndex(narr);
                }

                let larr = draft.linkDataArray;
                if (modifiedLinkData) {
                    modifiedLinkData.forEach((ld: go.ObjectData) => {
                        modifiedLinkMap.set(ld.key, ld);
                        const idx = this.mapLinkKeyIdx.get(ld.key);
                        if (idx !== undefined && idx >= 0) {
                            larr[idx] = ld;
                            if (draft.selectedData && draft.selectedData.key === ld.key) {
                                draft.selectedData = ld;
                            }
                        }
                    });
                }
                if (insertedLinkKeys) {
                    insertedLinkKeys.forEach((key: go.Key) => {
                        const ld = modifiedLinkMap.get(key);
                        const idx = this.mapLinkKeyIdx.get(key);
                        if (ld && idx === undefined) {
                            this.mapLinkKeyIdx.set(ld.key, larr.length);
                            larr.push(ld);
                        }
                    });
                }
                if (removedLinkKeys) {
                    larr = larr.filter((ld: go.ObjectData) => {
                        if (removedLinkKeys.includes(ld.key)) {
                            return false;
                        }
                        return true;
                    });
                    draft.linkDataArray = larr;
                    this.refreshLinkIndex(larr);
                }

                if (modifiedModelData) {
                    draft.modelData = modifiedModelData;
                }
                draft.skipsDiagramUpdate = true;
            })
        );
    }

    public handleInputChange(path: string, value: string, isBlur: boolean) {
        this.setState(
            produce((draft: AppState) => {
                const data = draft.selectedData as go.ObjectData;
                data[path] = value;
                if (isBlur) {
                    const key = data.key;
                    if (key < 0) {  // negative keys are links
                        const idx = this.mapLinkKeyIdx.get(key);
                        if (idx !== undefined && idx >= 0) {
                            draft.linkDataArray[idx] = data;
                            draft.skipsDiagramUpdate = false;
                        }
                    } else {
                        const idx = this.mapNodeKeyIdx.get(key);
                        if (idx !== undefined && idx >= 0) {
                            draft.nodeDataArray[idx] = data;
                            draft.skipsDiagramUpdate = false;
                        }
                    }
                }
            })
        );
    }

    /*
    * Функция, обрабатывающая json
    *
    * */
    public processing() {
        const obj = JSON.stringify(scenario2);
        this.jsonS = JSON.parse(obj)

        /*
        * Функция, создающая узлы из json
        *
        * возвращает массив узлов
        * */
        function dataNode() {
            const states = JSON.parse(obj).states;
            let array = [];
            for (let key in states) {
                array.push({key: states[key]["id"], text: states[key]["name"], description: states[key]["description"]})
            }
            return array
        }

        /*
        * Функция, создающая ссылки из json
        *
        * */
        function linkJSON() {
            const scen = JSON.parse(obj).scenario;
            let arrayLink = [];
            for (let key in scen) {
                for (let key2 in scen[key]["actions"]) {
                    let count = 0;
                    if ("set_state" in scen[key]["actions"][key2]) {
                        count += 1
                        arrayLink.push({
                            from: scen[key]["actions"][key2]["state"],
                            to: scen[key]["actions"][key2]["set_state"],
                            text: "event: " + scen[key]["event"],

                        })
                    } else {
                        for (let key3 in scen[key]["actions"][key2]["commands"]) {
                            if ("set_state" in scen[key]["actions"][key2]["commands"][key3]) {
                                count += 1
                                arrayLink.push({
                                    from: scen[key]["actions"][key2]["state"],
                                    to: scen[key]["actions"][key2]["commands"][key3]["set_state"],
                                    text: "event: " + scen[key]["event"] + " mode: " +
                                        scen[key]["actions"][key2]["commands"][key3]["pay_mode"],
                                })

                            }
                        }
                        if (count == 0) {
                            arrayLink.push({
                                from: scen[key]["actions"][key2]["state"],
                                to: scen[key]["actions"][key2]["state"],
                                text: "event: " + scen[key]["event"],
                            })
                        }
                    }
                }
            }
            return arrayLink;
        }

        const stringArr = linkJSON().map(str => JSON.stringify(str));
        // @ts-ignore
        const uniqueStrs = [...new Set(stringArr)] // removes duplicates
        const links = uniqueStrs.map(str => JSON.parse(str));
        links.sort((a, b) => parseFloat(a.from) - parseFloat(b.from));


        /*
        * Функция, проверящая количество ссылок, ссылающихся на Idle - 0
        *
        * Возвращает список узлов, которые ссылаются более, чем на один узел Idle - 0
        * */
        function checkLink() {
            let counts = {};
            let arrayFromTo = [];
            let arrayNode = [];
            for (let key in links) {
                arrayFromTo.push({from: links[key]["from"], to: links[key]["to"]})
            }
            const stringArr = arrayFromTo.map(str => JSON.stringify(str));
            stringArr.forEach(function (x) { // @ts-ignore
                counts[x] = (counts[x] || 0) + 1;
            });

            for (let key in counts) {
                // @ts-ignore
                if (counts[key] >= 1 && JSON.parse(key)["to"] == 0) {
                    arrayNode.push(JSON.parse(key));
                }
            }
            console.log(arrayNode)
            return arrayNode
        }



        const checkList = checkLink();


        /*
        * Функция, добавляющая узел, если на Idle - 0 ссылается больше 1 одного узла
        *
        * */
        function editNode() {
            let array = dataNode()
            let arrayText = []
            let minElem = 0
            for (let i in array) {
                if (array[i]["key"] < minElem) {
                    minElem = array[i]["key"]
                }
            }
            for (let key in array) {
                for (let key2 in checkList)
                    if (array[key]["key"] == checkList[key2]["to"]) {
                        arrayText.push({text: array[key]["text"], key: checkList[key2]["to"]})
                    }
            }
            for (let i of checkList) {
                minElem = minElem - 1
                for (let j in arrayText) {
                    if (arrayText[j]["key"] == i["to"]) {
                        // @ts-ignore
                        array.push({key: minElem, text: arrayText[j]["text"], from: i["from"], to: i["to"]})
                        break;
                    }

                }
            }
            return array
        }

        const nodeEdit = editNode();

        /*
        *   Функция, изменяющая ссылку после изменения узла
        *
        * */
        function editLinkIdle() {
            for (let key in nodeEdit) {

                for (let key2 in links) {
                    // @ts-ignore
                    if (nodeEdit[key]["from"] || nodeEdit[key]["from"] == 0) {
                        // @ts-ignore
                        if (links[key2]["from"] == nodeEdit[key]["from"] && links[key2]["to"] == nodeEdit[key]["to"]) {
                            links[key2]["to"] = nodeEdit[key]["key"]
                        }
                    }
                }
            }
        }

        editLinkIdle()
        return [nodeEdit, links]

    }

    /*
    * Функция, расставляющие ранги узлам (узел ссылается на следующий узел, значит новый ранг)
    * 
    * возвращает массив узлов и ссылок
    * */
    public rang() {
        let nodes = [...this.processing()[0]];
        let linkes = [...this.processing()[1]];
        nodes.filter((elem) => elem.key == 0)[0].pos = '0 0'
        nodes.filter((elem) => elem.key == 0)[0].rang = 0
        nodes.filter((elem) => elem.key == 0)[0].color = 'green'
        nodes.filter((elem) => elem.key == 0)[0].stroke = "Violet"
        nodes.filter((elem) => elem.text == 'Idle' && elem.key != 0).forEach(function (element) {
            element.color = "red";
        })

        let arr3 = []
        let arr2 = []
        for (let i in linkes) {
            let init = linkes[i]["from"]
            for (let j in linkes) {
                if (linkes[j]["from"] == init) {
                    arr3.push(linkes[j]["to"])
                }
            }
            // @ts-ignore
            arr2.push({key: linkes[i]["from"], listLink: [...new Set(arr3)]})
            arr3 = []
        }

        let stringArr = arr2.map(str => JSON.stringify(str));
        // @ts-ignore
        let uniqueStrs = [...new Set(stringArr)] // removes duplicates
        let arrayNodeLinkes = uniqueStrs.map(str => JSON.parse(str));
        let idleList = nodes.filter((elem) => elem.text == "Idle" && elem.key != 0).map((elem) => elem.key)


        /*
         * Функция, которая раставляет ранги
         *
         * */
        function rangListSet() {
            for (let key in arrayNodeLinkes) {
                let rang = nodes.filter((elem) => elem.key == arrayNodeLinkes[key]["key"] && 'rang' in elem)[0]?.rang
                if (rang != undefined) {
                    nodes.filter((elem) => (elem.rang == undefined) && arrayNodeLinkes[key]["listLink"].includes(elem.key)).forEach(function (element) {
                        element.rang = rang + 1;
                    })
                }
            }
        }

        for (let i in arrayNodeLinkes) {
            rangListSet()
        }
        // @ts-ignore
        let rangDouble = [...new Set(nodes.filter((elem) => idleList.includes(elem.key)).map((elem) => elem.rang))].sort()
        // @ts-ignore
        let count = 0
        for (let j of rangDouble) {
            nodes.filter((elem) => elem.rang >= j + count).forEach(function (elem) {
                if (!(elem.rang == j + count && elem.text == "Idle")) {
                    elem.rang += 1
                }
            })
            count += 1

        }

        return [nodes, linkes]
    }

    /*
    * Функция, задающая пространство узлам, расставляя их по рангам
    * 
    * */
    public setSpace() {
        let noteLinke = this.rang();
        let maxOfRangArr = noteLinke[0].filter((elem) => 'rang' in elem).map((elem) => elem.rang);
        let maxRang = Math.max.apply(Math, maxOfRangArr);
        // @ts-ignore
        for (let i of Array(maxRang + 1).keys()) {
            if (i != 0) {
                let countR = noteLinke[0].filter((elem) => elem.rang == i).map((elem) => elem.rang).length;
                // @ts-ignore
                let height = (countR * 100) / 2
                let columnWidth = this.columnWidth
                noteLinke[0].filter((elem) => elem.rang == i).forEach(function (element) {
                    // @ts-ignore
                    element.pos = "" + (i * columnWidth) + " " + (height)
                    height -= 100
                })
            }
        }
        let height = -100

        // @ts-ignore
        noteLinke[0].filter((elem) => elem.rang == undefined).forEach(function (element) {
            // @ts-ignore
            element.pos = "" + (0) + " " + (height)
            height -= 100
        })

        editLinkText()


        function editLinkText() {
            for (let key in noteLinke[1]) {
                let textArray = [];
                let from = noteLinke[1][key]["from"];
                let to = noteLinke[1][key]["to"];
                for (let key2 in noteLinke[1]) {

                    if (noteLinke[1][key2]["from"] == from && noteLinke[1][key2]["to"] == to && noteLinke[1][key2]["text"] != undefined) {
                        textArray.push(noteLinke[1][key2]["text"])
                        delete noteLinke[1][key2]["text"];
                    }
                }
                noteLinke[1][key]["info"] = textArray;

            }
        }

        return [noteLinke[0], noteLinke[1].filter((elem) => elem.info.length != 0)]

    }

    /*
    * Функция клика по узлу, также задает mode
    * 
    * */
    public clickNode(arrB: Array<object>, name: string) {
        let key;
        for (let i in arrB) {
            // @ts-ignore
            if (arrB[i].arr.includes(name)) {
                // @ts-ignore
                key = arrB[i].node
            }
        }
        let node = this?.nodeSel
        // @ts-ignore
        let j = this.jsonS["scenario"].filter((elem) =>
            elem.event == name.replace("event: ", '').split(' ')[0])
        // @ts-ignore
        let mode = j[0].actions.filter((elem) => elem.state == this.numberNode)[0];
        this.setState((prev) => {
            return {
                mode: mode?.set_pay_mode ? mode.set_pay_mode : prev.mode
            }
        });

        node?.select(node.findPartForKey(key))
        if (node?.findPartForKey(key).part.data.text == 'Idle') {
            console.log("Ждууу")
            setTimeout(this.returnIdle, 3000, node)
            this.setState(() => {
                return {
                    mode: 0,
                    divInfoEvent: null,
                    divInfoTimerStart: null,
                    divInfoTimerStop: null
                }
            });
        }
    }

    /*
    * Функция, которая возвращает клик по начальному узлу(Idle - 0)
    * 
    * */
    public returnIdle(node) {
        console.log("готово");
        node?.select(node.findPartForKey(0));
    }


    /*
    * Функция по выводу информации о событиях и командах
    * */
    public infoEventCommand(arrB: Array<object>, name: string, info) {
        let key;
        for (let i in arrB) {
            // @ts-ignore
            if (arrB[i].arr.includes(name)) {
                // @ts-ignore
                key = arrB[i].node
            }
        }
        // @ts-ignore
        let arrayInfoCommandsEvent = [];
        // @ts-ignore
        let arrayEventInService = [];
        // @ts-ignore
        let arrayEventTimer = [];
        // @ts-ignore
        let arrayDivComm = []
        let nextNode;
        // @ts-ignore
        let j = this.jsonS["scenario"].filter((elem) =>
            elem.event == name.replace("event: ", '').split(' ')[0])
        console.log(j)
        for (let i of j[0].actions) {
            console.log(i)
            if (i.state == this.numberNode) {
                //console.log(j[0].actions[i].commands)
                nextNode = i?.set_state
                for (let k in i.commands) {

                    if (i.commands[k].hasOwnProperty('event')) {
                        arrayEventInService.push(<li style={{color: "darkred"}}>Отправить событие
                            "№{i.commands[k].event} - {// @ts-ignore
                                this.jsonS["events"].filter((elem) =>
                                    elem.id == i.commands[k].event)[0]?.description}" сервису
                            №{i.commands[k].service}</li>)
                    } else {
                        // @ts-ignore
                        arrayInfoCommandsEvent.push(<li style={{color: "darkred"}}>
                            {/* eslint-disable-next-line react/no-unescaped-entities */}
                            Отправить событие "№{j[0].event} - {
                            // @ts-ignore
                            this.jsonS["events"].filter((elem) =>
                                elem.id == j[0].event)[0]?.description
                        }" сервису №{i.commands[k].service}</li>)
                    }
                    // @ts-ignore
                    if (i.commands[k].hasOwnProperty('pay_mode')) {
                        arrayEventInService.push(
                            <li>Pay_mode: {i.commands[k].pay_mode} - {this.jsonS["pay_modes"].filter((elem) =>
                                elem.id == i?.commands[k]?.pay_mode)[0]?.description}</li>)
                        if (i?.commands[k]?.pay_mode == this.state.mode) {
                            nextNode = i?.commands[k]?.set_state
                        }
                    }
                    if (i.commands[k].hasOwnProperty('wait_result')) {
                        let answer = i.commands[k]?.wait_result ? "Да" : "Нет"
                        // @ts-ignore
                        arrayEventInService.push(<li>Ожидать результат выполнения сервиса: {answer}</li>)
                    }

                    if (i.commands[k].hasOwnProperty('wait_timeout')) {
                        // @ts-ignore
                        arrayEventInService.push(<li>Ожидать результат в
                            течение: {i.commands[k]?.wait_timeout} секунд</li>)
                    }

                    arrayInfoCommandsEvent.push(arrayEventInService)
                    arrayDivComm.push(<div className={'div-info-events'}>{arrayInfoCommandsEvent}</div>)

                    arrayEventInService = []
                    arrayInfoCommandsEvent = []


                }
                arrayInfoCommandsEvent.push(<li style={{color: "green"}}>Переход в
                    состояние {nextNode || nextNode == 0 ? nextNode :
                        this.nodeSel.findPartForKey(this.numberNode)?.part.data.key} - {
                        this.nodeSel.findPartForKey(nextNode)?.part.data.text ?
                            this.nodeSel.findPartForKey(nextNode)?.part.data.text :
                            this.nodeSel.findPartForKey(this.numberNode)?.part.data.text}</li>)
                if (i.hasOwnProperty('set_pay_mode')) {
                    arrayInfoCommandsEvent.push(<li style={{color: "darkviolet"}}>Установить mode {i.set_pay_mode}</li>)
                }
                arrayDivComm.push(<div className={'div-info-events'}>{arrayInfoCommandsEvent}</div>)
                arrayEventTimer = []

                if (i?.start_timer) {
                    // @ts-ignore
                    let timer = this.jsonS["timers"].filter((elem) => elem.id == i?.start_timer)
                    arrayEventTimer.push(<li>запускается таймер № {i.start_timer}</li>)
                    arrayEventTimer.push(<li>Название: {timer[0].name}</li>)
                    arrayEventTimer.push(<li>Истекающее событие: {timer[0].expire_event}</li>)
                    arrayEventTimer.push(<li>Описание: {timer[0].description}</li>)
                    arrayEventTimer.push(<li>Время: {timer[0].timeout} секунд</li>)
                    arrayDivComm.push(<div className={'div-timers-start'}
                                           hidden={!arrayEventTimer}>{arrayEventTimer}</div>)
                    arrayEventTimer = []
                    this.setState(() => {
                        return {
                            divInfoTimerStart: [
                                // eslint-disable-next-line react/jsx-key
                                // @ts-ignore
                                // eslint-disable-next-line react/jsx-key
                                [<div className={'div-timers-start'}>{arrayEventTimer}</div>]
                            ]
                        }
                    });

                }
                if (i?.stop_timer) {
                    // @ts-ignore
                    let timer = this.jsonS["timers"].filter((elem) => elem.id == i?.stop_timer)
                    arrayEventTimer.push(<li>Останавливается таймер № {i.stop_timer}</li>)
                    arrayEventTimer.push(<li>Название: {timer[0].name}</li>)
                    arrayEventTimer.push(<li>Истекающее событие: {timer[0].expire_event}</li>)
                    arrayEventTimer.push(<li>Описание: {timer[0].description}</li>)
                    arrayEventTimer.push(<li>Время: {timer[0].timeout} секунд</li>)
                    arrayDivComm.push(<div className={'div-timers-stop'}
                                           hidden={!arrayEventTimer}>{arrayEventTimer}</div>)
                    this.setState(() => {
                        return {
                            divInfoTimerStart: [
                                // eslint-disable-next-line react/jsx-key
                                // @ts-ignore
                                // eslint-disable-next-line react/jsx-key
                                [<div className={'div-timers-stop'}>{arrayEventTimer}</div>]
                            ]
                        }
                    });

                }
                this.setState((prev) => {
                    return {
                        divInfoEvent: [
                            // eslint-disable-next-line react/jsx-key
                            // @ts-ignore
                            arrayDivComm
                        ]
                    }
                });
            }
        }
    }

    public deleteInfoEvent() {
        this.setState((prev) => {
            return {
                divInfoEvent: null,
                divInfoTimerStart: null,
                divInfoTimerStop: null
            }
        });
    }


    public render() {
        // @ts-ignore
        const selectedData = {...this.state.selectedData};

        // @ts-ignore
        let inspector;
        // @ts-ignore
        let info;
        if (selectedData !== null) {
            inspector = <SelectionInspector
                selectedData={this.state.selectedData}
                onInputChange={this.handleInputChange}
            />;
        }
        //
        let ar = this.state.arrayButton
        // @ts-ignore
        let arrB = []
        for (let i in ar) {
            arrB.push(...ar[i].arr)
        }
        let but = [];
        for (let i of arrB) {
            // @ts-ignore
            let j = this.jsonS["events"].filter((element) =>
                element.id == i.replace("event: ", '').split(' ')[0]).map((e) => e.description)
            // @ts-ignore

            // @ts-ignore
            if (i.indexOf("mode") < 0) {
                but.push(<button className={'color-btn'} onClick={// @ts-ignore
                    () => this.clickNode(ar, i)} onMouseEnter={() => this.infoEventCommand(ar, i, info)}
                                 onMouseLeave={this.deleteInfoEvent} id={i}>
                    <div>{i}</div>
                    {j}</button>)
            } else {
                console.log(this.state.mode)
                console.log(i.split(' '))
                if (i.split(" ")[3] == this.state.mode) {
                    console.log("тут")
                    but.push(<button className={'color-btn'} onClick={// @ts-ignore
                        () => this.clickNode(ar, i)} onMouseEnter={() => this.infoEventCommand(ar, i, info)}
                                     onMouseLeave={this.deleteInfoEvent} id={i}>
                        <div>{i}</div>
                        {j}</button>)
                }

            }

        }

        // @ts-ignore
        return (
            <div>
                <p>

                </p>
                <DiagramWrapper
                    nodeDataArray={this.state.nodeDataArray}
                    linkDataArray={this.state.linkDataArray}
                    modelData={this.state.modelData}
                    skipsDiagramUpdate={this.state.skipsDiagramUpdate}
                    onDiagramEvent={this.handleDiagramEvent}
                    onModelChange={this.handleModelChange}
                    buttonArr={this.state.arrayButton}
                />
                <div className={'div-component'}>
                    <div className={'div-mode'}>текущий mode: {this.state.mode}</div>
                    <div className={' div-nodeInfo'}>{inspector}</div>
                    <div className={'div-info-event'} hidden={!this.state.divInfoEvent}>{this.state.divInfoEvent}</div>
                </div>
                <div className={'btn'}>{but.map((el) => el)}</div>
            </div>
        );
    }
}

export default App;
