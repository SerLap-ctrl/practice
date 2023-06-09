import * as go from 'gojs';
import {ReactDiagram} from 'gojs-react';
import * as React from 'react';

interface DiagramProps {
    nodeDataArray: Array<go.ObjectData>;
    linkDataArray: Array<go.ObjectData>;
    modelData: go.ObjectData;
    skipsDiagramUpdate: boolean;
    onDiagramEvent: (e: go.DiagramEvent) => void;
    onModelChange: (e: go.IncrementalData) => void;
}


export class DiagramWrapper extends React.Component<DiagramProps, {}> {
    private readonly diagramRef: React.RefObject<ReactDiagram>;
    private diagramStyle: { backgroundColor: string } = {backgroundColor: '#eee'};
    private nodeInit: number = 0;

    constructor(props: DiagramProps) {
        super(props);
        this.diagramRef = React.createRef();
    }

    public componentDidMount() {
        if (!this.diagramRef.current) return;
        const diagram = this.diagramRef.current.getDiagram();
        if (diagram instanceof go.Diagram) {
            diagram.addDiagramListener('ChangedSelection', this.props.onDiagramEvent);
        }
        return diagram;
    }

    public componentWillUnmount() {
        if (!this.diagramRef.current) return;
        const diagram = this.diagramRef.current.getDiagram();
        if (diagram instanceof go.Diagram) {
            diagram.removeDiagramListener('ChangedSelection', this.props.onDiagramEvent);
        }
    }

    public render() {
        const diagram = this.diagramRef.current?.getDiagram();
        if (diagram instanceof go.Diagram) {
            if (this.nodeInit == 0) {
                diagram.select(diagram.findPartForKey(0));
                this.nodeInit = 1;
            }

        }
        return (
            <div>
                <ReactDiagram
                    ref={this.diagramRef}
                    divClassName='diagram'
                    style={this.diagramStyle}
                    initDiagram={this.initDiagram}
                    nodeDataArray={this.props.nodeDataArray}
                    linkDataArray={this.props.linkDataArray}
                    modelData={this.props.modelData}
                    onModelChange={this.props.onModelChange}
                    skipsDiagramUpdate={this.props.skipsDiagramUpdate}
                />
            </div>
        );
    }

    private initDiagram(): go.Diagram {
        const $ = go.GraphObject.make;
        const diagram: go.Diagram =
            $(go.Diagram,
                {
                    'undoManager.isEnabled': true,  // must be set to allow for model change listening
                    'undoManager.maxHistoryLength': 0,  // uncomment disable undo/redo functionality

                    model: $(go.GraphLinksModel,
                        {
                            linkKeyProperty: 'key',  // IMPORTANT! must be defined for merges and data sync when using GraphLinksModel
                            // positive keys for nodes
                            makeUniqueKeyFunction: (m: go.Model, data: any) => {
                                let k = data.key || 1;
                                while (m.findNodeDataForKey(k)) k++;
                                data.key = k;
                                return k;
                            },
                            // negative keys for links
                            makeUniqueLinkKeyFunction: (m: go.GraphLinksModel, data: any) => {
                                let k = data.key || -1;
                                while (m.findLinkDataForKey(k)) k--;
                                data.key = k;
                                return k;
                            }
                        })
                }, {initialAutoScale: go.Diagram.Uniform});


        diagram.nodeTemplate =
            $(go.Node, 'Auto', {locationSpot: go.Spot.Center}, {selectionAdorned: false},
                new go.Binding('position', 'pos', go.Point.parse).makeTwoWay(go.Point.stringify),
                $(go.Panel, "Auto",
                    $(go.Shape, "RoundedRectangle", {
                            fill: "#9f81e7", // the default fill, if there is no data-binding
                            stroke: null,
                            height: 40,
                            strokeWidth: 3,
                            cursor: "pointer", // the Shape is the port, not the whole Node
                        }, new go.Binding("fill", "color"),
                        new go.Binding("stroke", "stroke"),
                        new go.Binding("stroke", "isSelected", sel => {
                            return sel ? "lime" : "#250469";
                        }).ofObject(),
                        {name: "SHAPE"}),
                    $(go.TextBlock, {
                            editable: false
                        },
                        new go.Binding("text", "text"))
                )
            );


        function linkPath() {
            return $(go.Shape, {isPanelMain: false, strokeWidth: 2, toArrow: "Standard"});
        }

        diagram.linkTemplate = $(go.Link,
            {
                routing: go.Link.Normal, corner: 0,
                relinkableFrom: true, relinkableTo: true,
                reshapable: true, resegmentable: true
            }, linkPath(), linkPath(), $(go.Panel, "Auto",
            )
        );

        return diagram;
    }
}