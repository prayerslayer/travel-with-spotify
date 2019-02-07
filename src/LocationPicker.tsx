import * as React from "react";
import { Location, getQueryLocationOf } from "./sparql";
import styled from "styled-components";

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

type Props = {
  onSelect: (l: Location) => void;
  selectedLocation: null | Location;
};

type State = {
  input: string;
  examples: Location[];
};

const LocationCard: React.SFC<{
  location: Location;
  onClick: (url: string) => void;
}> = function({ location, onClick }) {
  return (
    <div role="button" onClick={() => onClick(location.uri)}>
      <h1>{location.name}</h1>
      <p>{location.abstract}</p>
    </div>
  );
};

export default class LocationPicker extends React.Component<Props, State> {
  state = {
    input: "",
    examples: [
      {
        name: "Graz",
        uri: "http://dbpedia.org/resource/Graz",
        abstract: "No one cares"
      },
      {
        name: "Vienna",
        uri: "http://dbpedia.org/resource/Vienna",
        abstract: "Capital city"
      },
      {
        name: "Finland",
        uri: "http://dbpedia.org/resource/Finland",
        abstract: "Larger country with fewer people"
      },
      {
        name: "Japan",
        uri: "http://dbpedia.org/resource/Japan",
        abstract: "The weird one"
      }
    ]
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
      <section>
        {this.props.selectedLocation === null && (
          <React.Fragment>
            <div>
              <Input
                type="text"
                value={this.state.input}
                placeholder="Paste wikipedia page"
                onChange={this.handleText.bind(this)}
              />

              <Button onClick={this.handleClick.bind(this)}>Start</Button>
            </div>
            <div>
              {this.state.examples.map(location => (
                <LocationCard
                  onClick={() => this.props.onSelect(location)}
                  location={location}
                />
              ))}
            </div>
          </React.Fragment>
        )}
      </section>
    );
  }
}
