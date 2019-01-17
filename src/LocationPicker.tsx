import * as React from "react";
import { Location } from "./location";

function getQueryLocationOf(wikipage: string) {
  return `SELECT DISTINCT ?Location, ?Name, ?Abstract WHERE {
    ?Location foaf:isPrimaryTopicOf <${wikipage}> .
    ?Location foaf:name ?Name .
    ?Location dbo:abstract ?Abstract .
    FILTER langMatches( lang(?Abstract), "EN" ) .
    FILTER langMatches ( lang(?Name), "EN" )
  }
  LIMIT 1`;
}

type Props = {
  onSelect: (l: Location) => void;
}

type State = {
  input: string;
}

export default class LocationPicker extends React.Component<Props, State> {
  state = {
    input: "https://en.wikipedia.org/wiki/Austria",
  };

  handleText(e) {
    this.setState({
      input: e.target.value
    });
  }

  async handleClick() {
    const text = this.state.input.replace("https://", "http://");
    const uri = `https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=${encodeURIComponent(
      getQueryLocationOf(text)
    )}&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query`;
    const resp = await fetch(uri);
    if (resp.ok) {
      const data = (await resp.json()).results.bindings.map(b => ({
        uri: b.Location.value,
        name: b.Name.value,
        abstract: b.Abstract.value
      }));
      if (data.length > 0) {
        this.props.onSelect(data[0]);
      }
    }
  }

  render() {
    return (
      <div className="Location">
        <input
          type="text"
          value={this.state.input}
          placeholder="Paste wikipedia page"
          onChange={this.handleText.bind(this)}
        />
        <button onClick={this.handleClick.bind(this)}>Start</button>
      </div>
    );
  }
}
