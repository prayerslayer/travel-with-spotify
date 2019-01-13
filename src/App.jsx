import React from "react";
import LocationPicker from "./LocationPicker";

function getQueryBandsIn(locationURI) {
  return `SELECT ?Band, ?Name WHERE {
  # hometown
  # 0 hop
  {
    ?Band foaf:name ?Name .  
    ?Band a schema:MusicGroup .
    ?Band dbo:hometown <${locationURI}>
  }
  # 1 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:hometown ?p1ht1 .
    ?p1ht1 dbo:isPartOf <${locationURI}>
  }
  # 2 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:hometown ?p1ht2 .
    ?p1ht2 dbo:isPartOf ?p2ht2 .
    ?p2ht2 dbo:isPartOf <${locationURI}>
  }
  # birthplace
  # 0 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:birthPlace <${locationURI}>
  }
  # 1 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:birthPlace ?p1bp1 .
    ?p1bp1 dbo:isPartOf <${locationURI}>
  }
  # 2 hop
  UNION {
    ?Band foaf:name ?Name .
    ?Band a schema:MusicGroup .
    ?Band dbo:birthPlace ?p1bp2 .
    ?p1bp2 dbo:isPartOf ?p2bp2 .
    ?p2bp2 dbo:isPartOf <${locationURI}>
  }
}`;
}

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      bands: []
    };
  }

  async handleLocation(location) {
    const bandQuery = getQueryBandsIn(location);
    const uri = `https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=${encodeURIComponent(
      bandQuery
    )}&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query`;
    const resp = await fetch(uri);
    if (resp.ok) {
      const data = await resp.json();
      this.setState({
        bands: data.results.bindings.map(b => ({
          name: b.Name.value,
          uri: b.Band.value
        }))
      });
    }
  }

  render() {
    return (
      <div>
        <LocationPicker onSelect={this.handleLocation.bind(this)} />
        <ul>
          {this.state.bands.map(band => (
            <li key={band.uri}>{band.name}</li>
          ))}
        </ul>
      </div>
    );
  }
}
