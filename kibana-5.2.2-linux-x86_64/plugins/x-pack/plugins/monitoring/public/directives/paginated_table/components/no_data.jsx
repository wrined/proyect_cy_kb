import React from 'react';

export default class NoData extends React.Component {
  render() {
    const colSpan = this.props.columns.length;
    return (
      <tbody>
        <tr>
          <td colSpan={ colSpan } className="loading">
            <span>There are no records that match your query. Try changing the time range selection.</span>
          </td>
        </tr>
      </tbody>
    );
  }
}
