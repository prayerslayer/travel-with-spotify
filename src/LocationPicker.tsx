import * as React from "react";
import { Location } from "./graphql";
import styled from 'styled-components';

const Button = styled.button`
  background: transparent;
  border-radius: 3px;
  border: 2px solid palevioletred;
  color: palevioletred;
  margin: 0 1em;
  padding: 0.25em 1em;
`;

const Input = styled.input`
  padding: 0.25em 1em;
`;

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
      // TODO alert/select if more than one
    }
  }

  render() {
    return (
      <div className="Location">
        <Input
          type="text"
          value={this.state.input}
          placeholder="Paste wikipedia page"
          onChange={this.handleText.bind(this)}
        />

        <Button onClick={this.handleClick.bind(this)}>Start</Button>
      </div>
    );
  }
}
