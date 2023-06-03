import * as React from 'react';

interface InspectorRowProps {
  id: string;
  value: string;
}

export class InspectorRow extends React.PureComponent<InspectorRowProps, {}> {
  constructor(props: InspectorRowProps) {
    super(props);
  }

  public render() {
    let val: string = this.props.value;
    if (this.props.id === 'loc') {
      val = this.formatLocation(this.props.value);
    }
    return (
      <tr>
        <td>{this.props.id + ':'}</td>
        <td>
          {val + ""}
        </td>
      </tr>
    );
  }

  private formatLocation(loc: string): string {
    const locArr: string[] = loc.split(' ');
    if (locArr.length === 2) {
      const x: number = parseFloat(locArr[0]);
      const y: number = parseFloat(locArr[1]);
      if (!isNaN(x) && !isNaN(y)) {
        return `${x.toFixed(0)} ${y.toFixed(0)}`;
      }
    }
    return loc;
  }
}
