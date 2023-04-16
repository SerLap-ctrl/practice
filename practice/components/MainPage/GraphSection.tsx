import React, {useEffect, useRef, useState} from "react";
import dynamic from "next/dynamic";
import scenario from "../../public/scenario.json"
import {commands} from "next/dist/lib/commands";


const NoSSRForceGraph = dynamic(() => import('../../lib/NoSSRForceGraph'), {ssr: false});

const obj = JSON.stringify(scenario);
const states = JSON.parse(obj).states;
const scen = JSON.parse(obj).scenario;

function linkJSON(scen) {
    let arrayLink = [];
    let arrayEvent = [];
    for (let key in scen) {
        for (let key2 in scen[key]["actions"]) {
            if ("set_state" in scen[key]["actions"][key2]) {
                arrayLink.push({
                    source: scen[key]["actions"][key2]["state"],
                    target: scen[key]["actions"][key2]["set_state"],
                    commands: scen[key]["actions"][key2]["commands"],
                    name: scen[key]["event"]
                })
            }
        }
    }
    return arrayLink;
}

const links = linkJSON(scen);
const myData = {
    nodes: [...states],
    links: [...links]
};
const nodeCanvasObject = (node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = 16 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = node.color;
    node.color = 'rgba(22,4,105,0.8)';

    ctx.fillText(label, node.x, node.y);

    node.__bckgDimensions = bckgDimensions;
}

const nodePointerAreaPaint = (node, color, ctx) => {
    ctx.fillStyle = color;
    const bckgDimensions = node.__bckgDimensions;
    bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y -
        bckgDimensions[1] / 2, ...bckgDimensions);
}

const handleNodeClick = (node, link) => {
    console.log(node.links)
};

const linkColor = () => {
    'rgba(134,11,11,0.8)'
}


export default function GraphSection(props: any) {
    return (
        <main className="main_section">
            <h1 className=""></h1>
            <section>
                <NoSSRForceGraph graphData={myData}
                                 nodeAutoColorBy="group"
                                 nodeCanvasObject={nodeCanvasObject}
                                 nodePointerAreaPaint={nodePointerAreaPaint}
                                 linkColor={linkColor}
                                 onNodeClick={handleNodeClick}
                                 linkDirectionalArrowLength={4}
                                 linkDirectionalParticleColor={() => "red"}
                                 //linkDirectionalArrowRelPos={1}
                                 linkCurvature={0.09}
                ></NoSSRForceGraph>
            </section>
        </main>
    );
}

