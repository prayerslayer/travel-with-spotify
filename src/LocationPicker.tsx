import * as React from "react";
import { Location, getQueryLocationOf } from "./sparql";
import styled from "styled-components";
import _get from "lodash-es/get";
import { Button, Row, Heading, Paragraph } from "./components/Layout";

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

const Card = styled.div`
  width: 200px;
  border: 1px solid #633;
  border-radius: 2px;
  padding: 10px;
  margin: 5px;
  user-select: none;
  cursor: pointer;

  :hover {
    box-shadow: 0px 0px 3px #633;
  }
`;

export const LargeLocation: React.SFC<{
  location: Location;
}> = function({ location }) {
  const excerpt = location.abstract.substr(0, 500);
  return (
    <section>
      <Heading>{location.name}</Heading>
      {location.image && <img src={location.image} alt="" />}
      <Paragraph>
        {excerpt}
        {excerpt.length < location.abstract.length ? "…" : null}
      </Paragraph>
    </section>
  );
};

export const LocationCard: React.SFC<{
  location: Location;
  onClick: (url: string) => void;
}> = function({ location, onClick }) {
  return (
    <Card role="button" onClick={() => onClick(location.uri)}>
      <Heading>{location.name}</Heading>
      <Paragraph>{location.abstract}</Paragraph>
    </Card>
  );
};

export default class LocationPicker extends React.Component<Props, State> {
  state = {
    input: "",
    examples: [
      {
        name: "Graz",
        uri: "http://dbpedia.org/resource/Graz",
        abstract:
          'Graz has a long tradition as a "university town": its six universities have more than 44,000 students. Its "Old Town" is one of the best-preserved city centres in Central Europe.'
      },
      {
        name: "Vienna",
        uri: "http://dbpedia.org/resource/Vienna",
        abstract:
          "Vienna is the capital and largest city of Austria and one of the nine states of Austria. Vienna is Austria’s primary city, with a population of about 1.8 million, and its cultural, economic, and political centre."
      },
      {
        name: "Finland",
        uri: "http://dbpedia.org/resource/Finland",
        abstract:
          "Finland is situated in the geographical region of Fennoscandia, which also includes Scandinavia. The majority of the population is concentrated in the southern region."
      },
      {
        name: "Japan",
        uri: "http://dbpedia.org/resource/Japan",
        abstract:
          'Japan is an island country in East Asia. The kanji that make up Japan’s name mean "sun origin", and it is often called the "Land of the Rising Sun".'
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
    const fallbackText = text.split("/")[text.split("/").length - 1];
    if (resp.ok) {
      const data = (await resp.json()).results.bindings.map(b => ({
        uri: b.Location.value,
        name: _get(b, "Name.value", fallbackText),
        abstract: b.Abstract.value,
        image: _get(b, "Image.value")
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
            <Row>
              {this.state.examples.map(location => (
                <LocationCard
                  onClick={() => this.props.onSelect(location)}
                  location={location}
                />
              ))}
            </Row>
          </React.Fragment>
        )}
      </section>
    );
  }
}
