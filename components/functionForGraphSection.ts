import {ArrayTextType, Counts, DataLinksType, DataNodeType, KeyRefersToList, Link} from "@/src/types/TypesGraphSection";
import {JSONScenario} from "@/src/types/JsonScenario";

/**
 * Внутрення функция, создающая ссылки из json
 *
 * @description Обходит файл json и ищет в нем set_state на различных уровнях, создавая в итоге ссылку,
 * состоющую из from: state, to: set_state, text: event#. Если нет команды set_state, то to:state
 *
 **/
export function creatLinkJSON(obj: string): DataLinksType[] {
    let scenario = JSON.parse(obj).scenario;
    let arrayLink: DataLinksType[] = [];
    for (let objScenario of scenario) {
        for (let objScenarioAction of objScenario.actions) {
            let count = 0;
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

/**
 * Внутренняя функция, которая раставляет ранги
 *
 *@param links Массив ссылок графа
 *
 *@return links
 *@description Возвращает массив ссылок с доп информацией о событиях
 **/
export function editLinkText(links: DataLinksType[]): DataLinksType[] {
    for (let linkOne of links) {
        let textArray: string[] = [];
        let from = linkOne.from;
        let to = linkOne.to;
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

/**
 * Внутренняя функция, изменяющая ссылку после изменения узла
 *
 *@param nodesEdit Массив узлов с добавлением элементов
 *@param links Массив ссылок графа
 *
 *@return links
 *@description Возвращает массив ссылок
 **/
export function editLinksIdle(nodesEdit: DataNodeType[], links: DataLinksType[]): DataLinksType[] {
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

/**
 * Внутрення функция, создающая узлы из json
 *
 * @param jsonS
 *
 * @return arrayNode
 * @description возвращает массив узлов
 **/
export function createDataNodes(jsonS: JSONScenario): DataNodeType[] {
    let states = jsonS.states;
    let arrayNode: DataNodeType[] = [];
    for (let state of states) {
        arrayNode.push({key: state.id, text: state.name, description: state.description})
    }
    return arrayNode;
}

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
export function setRangList(keyRefersToList: KeyRefersToList[], nodes: DataNodeType[]): DataNodeType[] {
    for (let obj of keyRefersToList) {
        const rang = nodes.find((elem) => elem.key === obj.key && elem.hasOwnProperty('rang'))?.rang;
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

/**
 * Внутрення функция, проверящая количество ссылок, ссылающихся на Idle - 0
 *
 *
 * @return arrayNode
 * @description Возвращает список узлов, которые ссылаются более, чем на один узел Idle - 0
 **/
export function checkLinks(links: DataLinksType[]): DataNodeType[] {
    let counts: Counts = {};
    let arrayFromTo: Link[] = [];
    let arrayNode: DataNodeType[] = [];
    for (let link of links) {
        arrayFromTo.push({from: link.from, to: link.to});
    }
    let stringArr = arrayFromTo.map((elem: Link) => JSON.stringify(elem));
    stringArr.forEach((x: string) => {
        counts[x] = (counts[x] || 0) + 1;
    });

    for (let key in counts) {
        if (counts[key] >= 1 && JSON.parse(key).to == 0) {
            arrayNode.push(JSON.parse(key));
        }
    }
    return arrayNode;
}

/**
 * Внутренняя функция, добавляющая узел, если на Idle - 0 ссылается больше 1 одного узла
 *
 *@param checkList Измененный массив ссылок
 *@param nodeList Массив узлов
 **/
export function editNodes(checkList: DataNodeType[], nodeList: DataNodeType[]): DataNodeType[] {
    let arrayText: ArrayTextType[] = [];
    let minElem = 0;
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