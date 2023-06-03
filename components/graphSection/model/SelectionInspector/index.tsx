import * as React from 'react';
import {InspectorRow} from './InspectorRow';
import {Block} from '@/components/graphSection/model/Block'
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
    const dets = [];
    const attributeInvisible = ["pos", "stroke", "color", "from", "to", "rang"]
    for (const k in selObj) {
      const val = selObj[k];
      if (!attributeInvisible.some(v => k.includes(v))) {
        const row = <InspectorRow
          key={k}
          id={k}
          value={val}
        />;

        if (k === 'key') {
          dets.unshift(row);
        } else {
          dets.push(row);
        }
      }
    }
    return dets;
  }
}
