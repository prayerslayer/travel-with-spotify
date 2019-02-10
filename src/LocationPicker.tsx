import * as React from "react";
import { Location, getQueryLocationOf } from "./sparql";
import styled from "styled-components";
import _get from "lodash-es/get";
import {
  Row,
  H3,
  Paragraph,
  Col,
  LargeInput,
  MediumPrimaryButton,
  Grid,
  SpanningRow
} from "./components/Layout";

type Props = {
  onSelect: (l: Location) => void;
  selectedLocation: null | Location;
};

type State = {
  input: string;
  examples: Location[];
};

const Card = styled.div`
  background: royalblue;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
`;

export const LocationCard: React.SFC<{
  location: Location;
  onClick: (url: string) => void;
}> = function({ location, onClick }) {
  return (
    <Card role="button" onClick={() => onClick(location.uri)}>
      <H3>{location.name}</H3>
    </Card>
  );
};

export default class LocationPicker extends React.Component<Props, State> {
  state = {
    input: "",
    examples: [
      {
        name: "Graz",
        uri: "http://dbpedia.org/resource/Graz"
      },
      {
        name: "Vienna",
        uri: "http://dbpedia.org/resource/Vienna"
      },
      {
        name: "Finland",
        uri: "http://dbpedia.org/resource/Finland"
      },
      {
        name: "Japan",
        uri: "http://dbpedia.org/resource/Japan"
      }
    ]
  };

  handleText = e => {
    this.setState({
      input: e.target.value
    });
  };

  handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      this.fetchLocation();
    }
  };

  fetchLocation = async () => {
    const text = this.state.input.replace("https://", "http://");
    const uri = `https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=${encodeURIComponent(
      getQueryLocationOf(text)
    )}&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query`;
    const resp = await fetch(uri);
    const fallbackText = text.split("/")[text.split("/").length - 1];
    if (resp.ok) {
      const data = (await resp.json()).results.bindings.map(b => ({
        uri: b.Location.value,
        name: _get(b, "Name.value", fallbackText)
      }));
      if (data.length > 0) {
        this.props.onSelect(data[0]);
      }
    }
  };

  render() {
    return (
      <section>
        {this.props.selectedLocation === null && (
          <React.Fragment>
            <Grid>
              <SpanningRow style={{ width: 4 * 180, marginBottom: 25 }}>
                <Row>
                  <LargeInput
                    type="text"
                    autoFocus
                    value={this.state.input}
                    placeholder="Paste wikipedia page"
                    onChange={this.handleText}
                    onKeyUp={this.handleKey}
                  />

                  <MediumPrimaryButton onClick={this.fetchLocation}>
                    Start
                  </MediumPrimaryButton>
                </Row>
              </SpanningRow>
              {this.state.examples.map(location => (
                <LocationCard
                  key={location.uri}
                  onClick={() => this.props.onSelect(location)}
                  location={location}
                />
              ))}
            </Grid>
          </React.Fragment>
        )}
      </section>
    );
  }
}
