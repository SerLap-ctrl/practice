import * as React from 'react';
import {InspectorRow} from './InspectorRow';
import {Block} from '../Block'
import styles from './SelectionInspector.module.css'


interface SelectionInspectorProps {
  selectedData: any;
}

export class SelectionInspector extends React.PureComponent<SelectionInspectorProps, {}> {
  public render() {
    return (
      <Block className={styles.modelInfoEventTransitionSetMode} hidden={false}>
        <div id='myInspectorDiv' className='inspector'>
          <table>
            <tbody>
            {this.renderObjectDetails()}
            </tbody>
          </table>
        </div>
      </Block>
    );
  }

  private renderObjectDetails() {
    const selObj = this.props.selectedData;
    const dataDisplay = [];
    const attributeInvisible = ["pos", "stroke", "color", "rang"]
    for (const k in selObj) {
      const val = selObj[k];
      if (!attributeInvisible.some(v => k.includes(v))) {
        const row = <InspectorRow
          key={k}
          id={k}
          value={val}
        />;
        if (k === 'key') {
          dataDisplay.unshift(row);
        } else {
          dataDisplay.push(row);
        }
      }
    }
    return dataDisplay;
  }
}
