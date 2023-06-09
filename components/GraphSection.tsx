import * as go from 'gojs';
import {produce} from 'immer';
import * as React from 'react';
import {
    ArrayEventsFromNode,
    DataLinksType,
    DataNodeType,
    KeyRefersToList,
    NodeTypeWithRang
} from '@/src/types/TypesGraphSection';
import {DiagramWrapper} from '@/components/DiagramWrapper';
import scenario2 from "@/public/scenario_pre2.json";
import ModelContainer from "@/components/ModelContainer";
import {Convert, JSONScenario, Scenario} from "@/src/types/JsonScenario"
import {setMode} from '@/store/modePayment/stateModePayment'
import {connect, ConnectedProps} from "react-redux";
import {
    checkLinks,
    createDataNodes,
    editLinksIdle,
    editLinkText,
    editNodes,
    creatLinkJSON,
    setRangList
} from "@/components/functionForGraphSection"
import {RootState} from "@/store"

interface AppState {
    nodeDataArray: Array<go.ObjectData>;
    linkDataArray: Array<go.ObjectData>;
    modelData: go.ObjectData;
    selectedData: go.ObjectData | null;
    skipsDiagramUpdate: boolean;
    arrayButton: ArrayEventsFromNode[];
    divInfoEvent: Scenario | null;
    currentState: number | undefined;
    json: JSONScenario;
}

type GraphSectionPropsType = ConnectedProps<typeof connector>

/**
 * Компонент приложения, отвечающий за создание и обработку данных графа
 * **/
class GraphSection extends React.Component<GraphSectionPropsType, AppState> {
    private mapNodeKeyIdx: Map<go.Key, number>;
    private mapLinkKeyIdx: Map<go.Key, number>;
    private columnWidth: number = 150;
    private readonly initNodesLinks: (DataNodeType[] | DataLinksType[])[];
    private nodeSel: any = null;
    private readonly objFromJson: string;
    private jsonS: JSONScenario;
    private numberNode: number = 0;

    constructor(props: GraphSectionPropsType) {
        super(props);
        this.objFromJson = JSON.stringify(scenario2);
        this.jsonS = JSON.parse(this.objFromJson);
        this.initNodesLinks = this.setSpace();
        this.state = {
            nodeDataArray: [...this.initNodesLinks[0]],
            linkDataArray: [...this.initNodesLinks[1]],
            modelData: {canRelink: true},
            selectedData: null,
            skipsDiagramUpdate: false,
            arrayButton: [],
            divInfoEvent: null,
            currentState: 0,
            json: this.jsonS
        };

        this.mapNodeKeyIdx = new Map<go.Key, number>();
        this.mapLinkKeyIdx = new Map<go.Key, number>();
        this.refreshNodeIndex(this.state.nodeDataArray);
        this.refreshLinkIndex(this.state.linkDataArray);

        this.handleDiagramEvent = this.handleDiagramEvent.bind(this);
        this.handleModelChange = this.handleModelChange.bind(this);
        this.deleteInfoEvent = this.deleteInfoEvent.bind(this);
    }

    /**
     * Функция класса, обновляющая индексы узла графа
     *
     * @param nodeArr Массив узлов графа
     * **/
    private refreshNodeIndex(nodeArr: Array<go.ObjectData>): void {
        this.mapNodeKeyIdx.clear();
        nodeArr.forEach((n: go.ObjectData, idx: number) => {
            this.mapNodeKeyIdx.set(n.key, idx);
        });
    }

    /**
     * Функция класса, обновляющая индексы ссылки графа
     *
     * @param linkArr Массив ссылок графа
     * **/
    private refreshLinkIndex(linkArr: Array<go.ObjectData>): void {
        this.mapLinkKeyIdx.clear();
        linkArr.forEach((l: go.ObjectData, idx: number) => {
            this.mapLinkKeyIdx.set(l.key, idx);
        });
    }

    /**
     * Функция класса, обрабатывающая события взаимодествия с диаграммой
     *
     * @description Помимо обработки события, данная функция также записывает текующий нажатый узел
     *
     * @param event Событие взаимодействия с диаграммой
     * **/
    public handleDiagramEvent(event: go.DiagramEvent) {
        const name = event.name;
        switch (name) {
            case 'ChangedSelection': {
                const sel = event.subject.first();
                this.setState(
                    produce((draft: AppState) => {
                        if (sel) {
                            if (sel instanceof go.Node) {
                                this.numberNode = Number(sel.key);
                                const idx: number | undefined = this.mapNodeKeyIdx.get(sel.key);
                                this.nodeSel = sel.diagram;
                                let nds: go.Iterator<go.Link> = sel.findLinksOutOf();
                                let i: number = 0;
                                let arrayEventsFromNode: ArrayEventsFromNode[] = [];
                                draft.arrayButton = arrayEventsFromNode;
                                while (nds.count >= i) {
                                    let arrayEvents = nds.value?.data.info;
                                    let nodeKey = nds.value?.toNode?.data.key;
                                    if (arrayEvents != undefined) {
                                        arrayEventsFromNode.push({node: nodeKey, arrayEvents: arrayEvents});
                                    }
                                    nds.next();
                                    i += 1;
                                }
                                if (idx !== undefined && idx >= 0) {
                                    draft.selectedData = draft.nodeDataArray[idx];
                                }
                            } else if (sel instanceof go.Link) {
                                const idx: number | undefined = this.mapLinkKeyIdx.get(sel.key);
                                if (idx !== undefined && idx >= 0) {
                                    draft.selectedData = draft.linkDataArray[idx];
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

    /**
     * Функция класса, обрабатывающая изменения данных в диаграмме
     *
     * @param obj Объект данных
     * **/
    public handleModelChange(obj: go.IncrementalData) {
        const insertedNodeKeys: go.Key[] | undefined = obj.insertedNodeKeys;
        const modifiedNodeData: go.ObjectData | undefined = obj.modifiedNodeData;
        const removedNodeKeys: go.Key[] | undefined = obj.removedNodeKeys;
        const insertedLinkKeys: go.Key[] | undefined = obj.insertedLinkKeys;
        const modifiedLinkData: go.ObjectData | undefined = obj.modifiedLinkData;
        const removedLinkKeys: go.Key[] | undefined = obj.removedLinkKeys;
        const modifiedModelData: go.ObjectData | undefined = obj.modelData;


        const modifiedNodeMap: Map<go.Key, go.ObjectData> = new Map<go.Key, go.ObjectData>();
        const modifiedLinkMap: Map<go.Key, go.ObjectData> = new Map<go.Key, go.ObjectData>();
        this.setState(
            produce((draft: AppState) => {
                let nodeDataArray: go.ObjectData[] = draft.nodeDataArray;
                if (modifiedNodeData) {
                    modifiedNodeData.forEach((nd: go.ObjectData) => {
                        modifiedNodeMap.set(nd.key, nd);
                        const idx: number | undefined = this.mapNodeKeyIdx.get(nd.key);
                        if (idx !== undefined && idx >= 0) {
                            nodeDataArray[idx] = nd;
                            if (draft.selectedData && draft.selectedData.key === nd.key) {
                                draft.selectedData = nd;
                            }
                        }
                    });
                }
                if (insertedNodeKeys) {
                    insertedNodeKeys.forEach((key: go.Key) => {
                        const nd: go.ObjectData | undefined = modifiedNodeMap.get(key);
                        const idx: number | undefined = this.mapNodeKeyIdx.get(key);
                        if (nd && idx === undefined) {
                            this.mapNodeKeyIdx.set(nd.key, nodeDataArray.length);
                            nodeDataArray.push(nd);
                        }
                    });
                }
                if (removedNodeKeys) {
                    nodeDataArray = nodeDataArray.filter((nd: go.ObjectData) => {
                        return !removedNodeKeys.includes(nd.key);
                    });
                    draft.nodeDataArray = nodeDataArray;
                    this.refreshNodeIndex(nodeDataArray);
                }

                let larr: go.ObjectData[] = draft.linkDataArray;
                if (modifiedLinkData) {
                    modifiedLinkData.forEach((ld: go.ObjectData) => {
                        modifiedLinkMap.set(ld.key, ld);
                        const idx: number | undefined = this.mapLinkKeyIdx.get(ld.key);
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
                        const ld: go.ObjectData | undefined = modifiedLinkMap.get(key);
                        const idx: number | undefined = this.mapLinkKeyIdx.get(key);
                        if (ld && idx === undefined) {
                            this.mapLinkKeyIdx.set(ld.key, larr.length);
                            larr.push(ld);
                        }
                    });
                }
                if (removedLinkKeys) {
                    larr = larr.filter((ld: go.ObjectData) => {
                        return !removedLinkKeys.includes(ld.key);
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

    /**
     * Функция класса, обрабатывающая json и создающая узлы и ссылки на его основе
     *
     *@description Возвращает массив узлов и ссылок, на основе которых строится граф
     **/
    public processing(): Array<DataNodeType[] | DataLinksType[]> {
        this.jsonS = Convert.toJSONScenario(this.objFromJson)

        let stringArr = creatLinkJSON(this.objFromJson).map((str: DataLinksType) => JSON.stringify(str));
        let uniqueStringLink = Array.from(new Set(stringArr));
        let links: DataLinksType[] = uniqueStringLink.map((str) => JSON.parse(str));
        links.sort((a: DataLinksType, b: DataLinksType) =>
            parseFloat(String(a.from)) - parseFloat(String(b.from)));

        let checkList = checkLinks(links);
        let nodesEdit = editNodes(checkList, createDataNodes(this.jsonS));
        let linksEdit = editLinksIdle(nodesEdit, links);
        return [nodesEdit, linksEdit];

    }

    /**
     * Функция класса, расставляющие ранги узлам (узел ссылается на следующий узел, значит новый ранг)
     *
     *@return [nodes, links]
     *@description возвращает массив узлов и ссылок с расставленными рангами
     **/
    public setRang() {
        let process = this.processing();
        let nodes = [...process[0]] as DataNodeType[];
        let links = [...process[1]] as DataLinksType[];

        // Начальный узел Idle - 0 и установка ему значений для отображения
        let firstNodeIdle = nodes.filter((elem) => elem.key === 0)[0]
        firstNodeIdle.pos = '0 0';
        firstNodeIdle.rang = 0;
        firstNodeIdle.color = 'green';
        firstNodeIdle.stroke = "Violet";
        nodes.filter((elem) => elem.text == 'Idle' && elem.key != 0)
            .forEach((element: DataNodeType) => {
                element.color = "red";
            })
        let keys: number[] = [];
        let keyRefersToList: KeyRefersToList[] = [];
        for (let i in links) {
            let init = links[i].from;
            for (let j in links) {
                if (links[j].from === init) {
                    keys.push(links[j].to);
                }
            }
            keyRefersToList.push({key: links[i].from, listLink: Array.from(new Set(keys))});
            keys = [];
        }
        for (let i of nodes) {
            if (i.hasOwnProperty("to") || i.hasOwnProperty("from")) {
                delete i.to
                delete i.from
            }
        }
        let stringArr = keyRefersToList.map(str => JSON.stringify(str));
        let uniqueStringsKeyFromTo = Array.from(new Set(stringArr));
        keyRefersToList = uniqueStringsKeyFromTo.map(str => JSON.parse(str));
        let idleList = nodes.filter((elem: DataNodeType) => elem.text == "Idle" && elem.key != 0)
            .map((elem: DataNodeType) => elem.key);

        //Расставить всевозможные ранги
        for (let i in keyRefersToList) {
            nodes = setRangList(keyRefersToList, nodes);
        }

        //Убрать дупликаты
        let rangDouble = Array.from(new Set(nodes.filter((elem) => idleList.includes(elem.key))
            .map((elem) => elem.rang))).sort() as number[];

        //Расставить конечные узлы Idle после их родителей
        let count = 0;
        let nodesWithRang = nodes.filter((elem): elem is NodeTypeWithRang =>
            elem.hasOwnProperty("rang"))
        for (let j of rangDouble) {
            nodesWithRang.filter((elem) => elem.rang >= j + count)
                .forEach((elem) => {
                    if (!(elem.rang === j + count && elem.text === "Idle")) {
                        elem.rang = elem.rang + 1;
                    }
                })
            count += 1;
        }
        return [nodes, links];
    }

    /**
     * Функция класса, задающая пространство узлам, расставляя их по рангам
     *
     * @return [nodes, links]
     * @description возвращает массив узлов и ссылок с заданным узлу свойством - pos(позиция)
     **/
    public setSpace() {
        let ranges = this.setRang();
        let [nodes, links] = ranges as [DataNodeType[], DataLinksType[]]
        let maxOfRangArr = nodes.filter((elem) => elem.hasOwnProperty("rang"))
            .map((elem) => elem.rang) as number[];
        let arrayRang = Array.from(Array(Math.max.apply(Math, maxOfRangArr) + 1).keys());
        for (let elemArrayRang of arrayRang) {
            if (elemArrayRang != 0) {
                let countEveryRang = nodes.filter((elem) => elem.rang === elemArrayRang)
                    .map((elem) => elem.rang).length;
                let height = (countEveryRang * 100) / 2;
                let columnWidth = this.columnWidth;
                nodes.filter((elem) => elem.rang === elemArrayRang)
                    .forEach((element) => {
                        element.pos = (elemArrayRang * columnWidth) + " " + (height);
                        height -= 100;
                    })
            }
        }
        let height = -100;

        nodes.filter((elem) => elem.rang === undefined).forEach((element) => {
            element.pos = (0) + " " + (height);
            height -= 100;
        })

        links = editLinkText(links).filter((elem) => elem.info?.length != 0);
        return [nodes, links];
    }

    /**
     * Функция клика по узлу, также задает mode
     *
     *@param arrayObjNodeEvents
     *@param name
     * */
    public buttonClickProcessing(arrayObjNodeEvents: ArrayEventsFromNode[], name: string): void {
        let numberNode: number | undefined;
        for (let objNodeEvents of arrayObjNodeEvents) {

            if (objNodeEvents?.arrayEvents.includes(name)) {
                numberNode = objNodeEvents.node;
            }
        }
        let node = this?.nodeSel;
        let jsonWithEvent = this.jsonS.scenario.filter((elem) =>
            elem.event == Number(name.replace("event: ", '').split(' ')[0]));

        let mode = jsonWithEvent[0].actions.find((elem) => elem.state === this.numberNode);
        if (mode?.set_pay_mode) {
            this.props.setMode(mode?.set_pay_mode)
        }
        this.setState(() => {
            return {
                currentState: numberNode
            }
        });

        node?.select(node.findPartForKey(numberNode));
        if (node?.findPartForKey(numberNode).part.data.text === 'Idle') {
            setTimeout(this.returnIdle, 3000, node);
            this.props.setMode(0)
            this.setState(() => {
                return {
                    divInfoEvent: null,
                    currentState: 0
                }
            });
        }
    }

    /**
     * Функция, которая делает клик по начальному узлу(Idle - 0)
     *
     *@param node узел, который был на данный момент
     **/
    public returnIdle(node: go.Diagram): void {
        node?.select(node.findPartForKey(0));
    }

    /**
     *Функция класса по выводу информации о событиях и командах при наведении мышью
     *
     *@param name
     **/
    public infoEventCommand(name: string): void {
        let json = this.jsonS.scenario.find((elem) =>
            elem.event == Number(name.replace("event: ", '').split(' '))) as Scenario;
        if (json != undefined) {
            this.setState(() => {
                return {
                    divInfoEvent: json,
                    json: this.jsonS
                }
            });
        }
    }

    /**
     * Функция класса по скрытию информации после отвода мыши
     *
     * **/
    public deleteInfoEvent(): void {
        this.setState(() => {
            return {
                divInfoEvent: null,
            }
        });
    }

    /**
     *Функция класса по обработки странцы
     *
     **/
    public render(): JSX.Element {
        let arrayEventsFromNode = this.state.arrayButton
        let arrayPossibleEvents: string[] = []
        for (let elem of arrayEventsFromNode) {
            arrayPossibleEvents.push(...elem.arrayEvents)
        }
        let arrayButton = [];
        for (let elemArrayPossibleEvents of arrayPossibleEvents) {
            let j = this.jsonS.events.filter((element) =>
                element.id === Number(
                    elemArrayPossibleEvents
                        .replace("event: ", '')
                        .split(' ')[0]))
                .map((e) => e.description)
            if (elemArrayPossibleEvents.indexOf("mode") < 0) {
                arrayButton.push(
                    <button className={'colorBtn'}
                            onClick={() => this.buttonClickProcessing(arrayEventsFromNode, elemArrayPossibleEvents)}
                            onMouseEnter={() => this.infoEventCommand(elemArrayPossibleEvents)}
                            onMouseLeave={this.deleteInfoEvent} id={elemArrayPossibleEvents}>
                        <div>{elemArrayPossibleEvents}</div>
                        {j}</button>)
            } else {
                if (Number(elemArrayPossibleEvents.split(" ")[3]) === this.props.mode) {
                    arrayButton.push(
                        <button className={'colorBtn'}
                                onClick={() => this.buttonClickProcessing(arrayEventsFromNode, elemArrayPossibleEvents)}
                                onMouseEnter={() => this.infoEventCommand(elemArrayPossibleEvents)}
                                onMouseLeave={this.deleteInfoEvent} id={elemArrayPossibleEvents}>
                            <div>{elemArrayPossibleEvents}</div>
                            {j}</button>)
                }
            }
        }
        return (
            <div>
                <DiagramWrapper
                    nodeDataArray={this.state.nodeDataArray}
                    linkDataArray={this.state.linkDataArray}
                    modelData={this.state.modelData}
                    skipsDiagramUpdate={this.state.skipsDiagramUpdate}
                    onDiagramEvent={this.handleDiagramEvent}
                    onModelChange={this.handleModelChange}
                />

                <ModelContainer
                    mode={this.props.mode}
                    selectData={this.state.selectedData}
                    divInfoEvent={this.state.divInfoEvent}
                    currentState={this.state.currentState}
                    json={this.state.json}
                ></ModelContainer>

                <h1 className={'name'}>Возможные события</h1>
                <div className={'btn'}>{arrayButton.map((el) => el)}</div>
            </div>
        );
    }
}

const connector = connect((state: RootState) =>
    ({mode: state.modePayment.value}), {setMode})
export default connector(GraphSection)

