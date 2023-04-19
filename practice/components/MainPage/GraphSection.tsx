import scenario2 from "../../public/scenario_pre.json"
import React from 'react';

import * as go from 'gojs';
import {ReactDiagram} from 'gojs-react';

//import '../../src/styles/globals.css';  // contains .diagram-component CSS


function initDiagram() {
    const $ = go.GraphObject.make;
    // set your license key here before creating the diagram: go.Diagram.licenseKey = "...";
    const diagram =
        $(go.Diagram,
            {
                'undoManager.isEnabled': true,  // must be set to allow for model change listening
                // 'undoManager.maxHistoryLength': 0,  // uncomment disable undo/redo functionality
                'clickCreatingTool.archetypeNodeData': {text: 'new node', color: 'lightblue'},
                model: new go.GraphLinksModel(
                    {
                        linkKeyProperty: 'key'  // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
                    })
            });

    // define a simple Node template
    diagram.nodeTemplate =
        $(go.Node, 'Auto',
            new go.Binding('location', 'loc', go.Point.parse).makeTwoWay(go.Point.stringify),
            $(go.Shape, 'RoundedRectangle',
                {name: 'SHAPE', fill: 'white', strokeWidth: 0},{ fill: $(go.Brush, "Linear",
                        { 0.0: "Violet", 1.0: "Lavender" }) },
                // Shape.fill is bound to Node.data.color
                new go.Binding('fill', 'color')),
            $(go.TextBlock,
                {margin: 8, editable: true},
                new go.Binding('text').makeTwoWay()
            )
        );
    //
    // diagram.linkTemplate =
    //     $(go.Link,
    //         { routing: go.Link.AvoidsNodes,
    //             corner: 10 , curve: go.Link.JumpOver},                  // rounded corners
    //         $(go.Shape),
    //         $(go.Shape, { toArrow: "Standard" })
    //     );
    diagram.linkTemplate =
        $(go.Link,
             { routing: go.Link.Orthogonal,
                             corner: 10 , curve: go.Link.JumpOver},
            $(go.Shape),
            $(go.Shape, { toArrow: "Standard" })
        );
    return diagram;
}

const obj = JSON.stringify(scenario2);


function dataNode() {
    const states = JSON.parse(obj).states;
    let array = [];
    for (let key in states) {
        array.push({key: states[key]["id"], text: states[key]["name"]})
    }
    return array
}



const scen = JSON.parse(obj).scenario;

function linkJSON() {
    const scen = JSON.parse(obj).scenario;
    let arrayLink = [];
    for (let key in scen) {
        for (let key2 in scen[key]["actions"]) {
            if ("set_state" in scen[key]["actions"][key2]) {
                arrayLink.push({
                    from: scen[key]["actions"][key2]["state"],
                    to: scen[key]["actions"][key2]["set_state"]
                    //commands: scen[key]["actions"][key2]["commands"],
                    //name: scen[key]["event"]
                })
            }
        }
    }
    return arrayLink;
}

const links = linkJSON();


const stringArr = linkJSON().map(str => JSON.stringify(str));
const uniqueStrs = [ ...new Set(stringArr)] // removes duplicates
const result = uniqueStrs.map(str => JSON.parse(str));

console.log(result);


export default function GraphSection() {
    return (
        <div>
            <ReactDiagram
                initDiagram={initDiagram}
                divClassName='diagram-component'
                nodeDataArray={[...dataNode()]}

                linkDataArray={[...result]}
            />
        </div>
    );
}