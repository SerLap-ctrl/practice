import * as go from 'gojs';
import {produce} from 'immer';
import * as React from 'react';
import {
  ArrayEventsFromNode,
  ArrayTextType,
  Counts,
  DataLinksType,
  DataNodeType,
  KeyRefersToList,
  NodeTypeWithRang
} from '@/src/types/TypesGraphSection';

import {DiagramWrapper} from '@/components/graphSection/DiagramWrapper';
import scenario2 from "@/public/scenario_pre2.json";
import ModelContainer from "@/components/graphSection/ModelContainer";
import {Convert, JSONScenario, Scenario} from "@/src/types/JsonScenario"


interface AppState {
  nodeDataArray: Array<go.ObjectData>;
  linkDataArray: Array<go.ObjectData>;
  modelData: go.ObjectData;
  selectedData: go.ObjectData | null;
  skipsDiagramUpdate: boolean;
  arrayButton: ArrayEventsFromNode[];
  divInfoEvent: Scenario | null;
  mode: number;
  currentState: number | undefined;
  json: JSONScenario;
}

/**
 * Компонент приложения, отвечающий за создание и обработку данных графа
 * **/
class App extends React.Component<{}, AppState> {
  private mapNodeKeyIdx: Map<go.Key, number>;
  private mapLinkKeyIdx: Map<go.Key, number>;
  private minSpaceBlock: number | undefined;
  private columnWidth: number = 150;
  private readonly initNodesLinks: any;
  private nodeSel: any = null;
  private jsonS: JSONScenario;
  private numberNode: number = 0;

  constructor(props: object) {
    super(props);
    this.initNodesLinks = this.setSpace();
    let obj: string = JSON.stringify(scenario2);
    this.jsonS = JSON.parse(obj);
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
      arrayButton: [],
      divInfoEvent: null,
      mode: 0,
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
    this.minSpaceBlock = 100;
  }

  /**
   * Функция класса, обрабатывающая события взаимодествия с диаграммой
   *
   * @description Помимо обработки события, данная функция также записывает текующий нажатый узел
   *
   * @param event Событие взаимодействия с диаграммой
   * @type go.DiagramEvent
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
                  let eventsArr = nds.value?.data.info;
                  let nodeKey = nds.value?.toNode?.data.key;
                  if (eventsArr != undefined) {
                    arrayEventsFromNode.push({node: nodeKey, arrayEvents: eventsArr});
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
   * Функция класса, обрабатывающая изменения данных о диаграмме
   *
   * @param obj Объект данных
   * @type go.IncrementalData
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
   *@return [nodes, links]
   *@type Array<DataNodeType[] | DataLinksType[]>
   *@description Возвращает массив узлов и ссылок, на основе которых строится граф
   **/
  public processing(): Array<DataNodeType[] | DataLinksType[]> {
    let obj = JSON.stringify(scenario2);
    this.jsonS = Convert.toJSONScenario(obj)

    /**
     * Внутрення функция, создающая узлы из json
     *
     * @param jsonS
     *
     * @return arrayNode
     * @description возвращает массив узлов
     **/
    function createDataNodes(jsonS: JSONScenario): DataNodeType[] {
      let states = jsonS.states;
      let arrayNode: DataNodeType[] = [];
      for (let state of states) {
        arrayNode.push({key: state.id, text: state.name, description: state.description})
      }
      return arrayNode;
    }

    /**
     * Внутрення функция, создающая ссылки из json
     *
     * @description Обходит файл json и ищет в нем set_state на различных уровнях, создавая в итоге ссылку,
     * состоющую из from: state, to: set_state, text: event#. Если нет команды set_state, то to:state
     *
     **/
    function linkJSON(obj: string): DataLinksType[] {
      let scenario = JSON.parse(obj).scenario;
      let arrayLink: DataLinksType[] = [];
      for (let objScenario of scenario) {
        for (let objScenarioAction of objScenario.actions) {
          let count: number = 0;
          if ("set_state" in objScenarioAction) {
            count += 1;
            arrayLink.push({
              from: objScenarioAction.state,
              to: objScenarioAction.set_state,
              text: "event: " + objScenario.event,
            });
          } else {
            if (objScenarioAction.commands != undefined) {
              for (let objCommand of objScenarioAction.commands) {
                if (objCommand.hasOwnProperty("set_state")) {
                  count += 1;
                  arrayLink.push({
                    from: objScenarioAction.state,
                    to: objCommand.set_state,
                    text: "event: " + objScenario.event + " mode: " +
                      objCommand.pay_mode,
                  });
                }
              }
              if (count === 0) {
                arrayLink.push({
                  from: objScenarioAction.state,
                  to: objScenarioAction.state,
                  text: "event: " + objScenario.event,
                });
              }
            }
          }
        }
      }
      return arrayLink;
    }

    let stringArr = linkJSON(obj).map((str: DataLinksType) => JSON.stringify(str));
    let uniqueStringLink = Array.from(new Set(stringArr));
    let links: DataLinksType[] = uniqueStringLink.map((str) => JSON.parse(str));
    links.sort((a: DataLinksType, b: DataLinksType) =>
      parseFloat(String(a.from)) - parseFloat(String(b.from)));


    /**
     * Внутрення функция, проверящая количество ссылок, ссылающихся на Idle - 0
     *
     *
     * @return arrayNode
     * @description Возвращает список узлов, которые ссылаются более, чем на один узел Idle - 0
     **/
    function checkLinks(links: DataLinksType[]): DataNodeType[] {
      let counts: Counts = {};
      let arrayFromTo: { from: number, to: number }[] = [];
      let arrayNode: DataNodeType[] = [];
      for (let link of links) {
        arrayFromTo.push({from: link.from, to: link.to});
      }
      let stringArr = arrayFromTo.map((str: { from: number, to: number }) => JSON.stringify(str));
      stringArr.forEach((x: string) => {
        counts[x] = (counts[x] || 0) + 1;
      });

      for (let key in counts) {
        if (counts[key] >= 1 && JSON.parse(key).to== 0) {
          arrayNode.push(JSON.parse(key));
        }
      }
      return arrayNode;
    }

    let checkList = checkLinks(links);


    /**
     * Внутрення функция, добавляющая узел, если на Idle - 0 ссылается больше 1 одного узла
     *
     *@param checkList Измененный массив ссылок
     *
     *@param jsonS json-объект
     *
     *@return nodeList
     *@description Возвращает массив узлов с добавленными элементами
     **/
    function editNodes(checkList: DataNodeType[], jsonS: JSONScenario): DataNodeType[] {
      let nodeList: DataNodeType[] = createDataNodes(jsonS);
      let arrayText: ArrayTextType[] = [];
      let minElem: number = 0;
      for (let node of nodeList) {
        if (node.key < minElem) {
          minElem = node.key;
        }
      }
      for (let node of nodeList) {
        for (let nodeFromCheckList of checkList)
          if (node.key == nodeFromCheckList.to) {
            arrayText.push({text: node.text, key: nodeFromCheckList.to});
          }
      }
      for (let objCheckList of checkList) {
        minElem = minElem - 1;
        for (let objArrText of arrayText) {
          if (objArrText.key == objCheckList.to) {
            nodeList.push({
              key: minElem,
              text: objArrText.text,
              from: objCheckList.from,
              to: objCheckList.to
            });
            break;
          }
        }
      }
      return nodeList;
    }

    let nodesEdit = editNodes(checkList, this.jsonS);

    /**
     * Внутрення функция, изменяющая ссылку после изменения узла
     *
     *@param nodesEdit Массив узлов с добавлением элементов
     *
     *@param links Массив ссылок графа
     *
     *@return links
     *@description Возвращает массив ссылок
     **/
    function editLinksIdle(nodesEdit: DataNodeType[], links: DataLinksType[]): DataLinksType[] {
      for (let node of nodesEdit) {
        for (let link of links) {
          if (node.from || node.from == 0) {
            if (link.from == node.from && link.to == node.to) {
              link.to = node.key;
            }
          }
        }
      }
      return links;
    }

    let linksEdit = editLinksIdle(nodesEdit, links);
    return [nodesEdit, linksEdit];

  }

  /**
   * Функция класса, расставляющие ранги узлам (узел ссылается на следующий узел, значит новый ранг)
   *
   *@return [nodes, links]
   *@description возвращает массив узлов и ссылок с расставленными рангами
   **/
  public rang() {
    let process = this.processing();
    let nodes = [...process[0]] as DataNodeType[];
    let links = [...process[1]] as DataLinksType[];

    // Начальный узел Idle - 0
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
      let init: number = links[i].from;
      for (let j in links) {
        if (links[j].from === init) {
          keys.push(links[j].to);
        }
      }
      keyRefersToList.push({key: links[i].from, listLink: Array.from(new Set(keys))});
      keys = [];
    }

    for (let i of nodes){
      if (i.hasOwnProperty("to") || i.hasOwnProperty("from")){
        delete i.to
        delete i.from
      }
    }

    let stringArr = keyRefersToList.map(str => JSON.stringify(str));
    let uniqueStringsKeyFromTo = Array.from(new Set(stringArr));
    keyRefersToList = uniqueStringsKeyFromTo.map(str => JSON.parse(str));
    let idleList = nodes.filter((elem: DataNodeType) => elem.text == "Idle" && elem.key != 0)
      .map((elem: DataNodeType) => elem.key);

    /**
     * Внутренняя функция, которая раставляет ранги
     *
     *@param keyRefersToList Массив объектов, со свойствами key и listLink
     *
     *@param nodes Массив узлов
     *
     *@return nodes
     *@description Возвращает массив узлов с рангами
     **/
    function rangListSet(keyRefersToList: KeyRefersToList[], nodes: DataNodeType[]): DataNodeType[] {
      for (let obj of keyRefersToList) {
        const rang = nodes.find((elem) => elem.key === obj.key && 'rang' in elem)?.rang;
        if (rang != undefined) {
          let listNodeWithSameRang = nodes.filter((elem) => (elem.rang == undefined) &&
            obj.listLink.includes(elem.key))

          listNodeWithSameRang.forEach((element: DataNodeType) => {
            element.rang = rang + 1;
          })
        }
      }
      return nodes;
    }

    //Расставить всевозможные ранги
    for (let i in keyRefersToList) {
      nodes = rangListSet(keyRefersToList, nodes);
    }

    //Убрать дупликаты
    let rangDouble = Array.from(new Set(nodes.filter((elem) => idleList.includes(elem.key))
      .map((elem) => elem.rang))).sort() as number[];
    let count = 0;
    let nodesWithRang = nodes.filter((elem): elem is NodeTypeWithRang => elem.hasOwnProperty("rang"))
    console.log(nodesWithRang)
    for (let j of rangDouble) {
      nodesWithRang.filter((elem) =>  elem.rang >= j + count).forEach((elem) => {
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
    let ranges = this.rang();
    let [nodes, links] = ranges as [DataNodeType[], DataLinksType[]]
    let maxOfRangArr = nodes.filter((elem) => 'rang' in elem)
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
    let height: number = -100;

    nodes.filter((elem) => elem.rang === undefined).forEach((element) => {
      element.pos = (0) + " " + (height);
      height -= 100;
    })

    /**
     * Внутренняя функция, которая раставляет ранги
     *
     *@param links Массив ссылок графа
     *
     *@return links
     *@description Возвращает массив ссылок с доп информацией о событиях
     **/
    function editLinkText(links: DataLinksType[]): DataLinksType[] {
      for (let linkOne of links) {
        let textArray: string[] = [];
        let from: number = linkOne.from;
        let to: number = linkOne.to;
        for (let linkTwo of links) {
          if (linkTwo.from === from && linkTwo.to === to &&
            linkTwo.text != undefined) {
            textArray.push(linkTwo.text as string);
            delete linkTwo.text;
          }
        }
        linkOne.info = textArray;
      }
      return links
    }

    links = editLinkText(links).filter((elem) => elem.info?.length != 0);
    return [nodes, links];

  }

  /**
   * Функция клика по узлу, также задает mode
   *
   *@param arrB
   *
   *@param name
   * */
  public clickNode(arrB: ArrayEventsFromNode[], name: string): void {
    let numberNode: number | undefined;
    for (let elemArrB of arrB) {

      if (elemArrB?.arrayEvents.includes(name)) {
        numberNode = elemArrB.node;
      }
    }
    let node = this?.nodeSel;
    let json = this.jsonS.scenario.filter((elem) =>
      elem.event == Number(name.replace("event: ", '').split(' ')[0]));

    let mode = json[0].actions.filter((elem) => elem.state === this.numberNode)[0];
    this.setState((prev: Readonly<AppState>) => {
      return {
        mode: mode?.set_pay_mode ? mode.set_pay_mode : prev.mode,
        currentState: numberNode
      }
    });

    node?.select(node.findPartForKey(numberNode));
    if (node?.findPartForKey(numberNode).part.data.text === 'Idle') {
      setTimeout(this.returnIdle, 3000, node);
      this.setState(() => {
        return {
          mode: 0,
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
    console.log("готово");
    node?.select(node.findPartForKey(0));
  }

  /**
   *Функция класса по выводу информации о событиях и командах при наведении мышью
   *
   *@param arrayEventsBut
   *
   *@param name
   **/
  public infoEventCommand(arrayEventsBut: ArrayEventsFromNode[], name: string): void {
    let json = this.jsonS.scenario.find((elem) =>
      elem.event == Number(name.replace("event: ", '').split(' '))) as Scenario;
    if (json != undefined){
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
    this.setState(()=> {
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
    let arrayEventsFromNode: ArrayEventsFromNode[] = this.state.arrayButton
    let arrayPossibleEvents: string[] = []
    for (let elem of arrayEventsFromNode) {
      arrayPossibleEvents.push(...elem.arrayEvents)
    }
    let buttonArray = [];
    for (let elemArrayPossibleEvents of arrayPossibleEvents) {
      let j = this.jsonS.events.filter((element) =>
        element.id === Number(elemArrayPossibleEvents.replace("event: ", '').split(' ')[0]))
        .map((e) => e.description)
      if (elemArrayPossibleEvents.indexOf("mode") < 0) {
        buttonArray.push(
          <button className={'colorBtn'}
                  onClick={() => this.clickNode(arrayEventsFromNode, elemArrayPossibleEvents)}
                  onMouseEnter={() => this.infoEventCommand(arrayEventsFromNode, elemArrayPossibleEvents)}
                  onMouseLeave={this.deleteInfoEvent} id={elemArrayPossibleEvents}>
            <div>{elemArrayPossibleEvents}</div>
            {j}</button>)
      } else {
        if (Number(elemArrayPossibleEvents.split(" ")[3]) === this.state.mode) {
          buttonArray.push(
            <button className={'colorBtn'}
                    onClick={() => this.clickNode(arrayEventsFromNode, elemArrayPossibleEvents)}
                    onMouseEnter={() => this.infoEventCommand(arrayEventsFromNode, elemArrayPossibleEvents)}
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
          buttonArr={this.state.arrayButton}
        />

        <ModelContainer
          mode={this.state.mode}
          selectData={this.state.selectedData}
          divInfoEvent={this.state.divInfoEvent}
          currentState={this.state.currentState}
          json={this.state.json}
        ></ModelContainer>
        <h1 className={'name'}>Возможные события</h1>
        <div className={'btn'}>{buttonArray.map((el) => el)}</div>
      </div>
    );
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
}

export default App;
