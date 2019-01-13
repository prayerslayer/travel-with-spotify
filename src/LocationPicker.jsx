import React from 'react';

function getQueryLocationOf(wikipage) {
  return `select distinct ?Location where { ?Location foaf:isPrimaryTopicOf <${wikipage}>  } LIMIT 1`;
}


export default class LocationPicker extends React.Component {
  constructor() {
    super();
    this.state = {
      input: "https://en.wikipedia.org/wiki/Finland",
      state: null
    };
  }

  handleText(e) {
    this.setState({
      input: e.target.value
    })
  }

  async handleClick() {
    this.setState({
      state: "loading"
    });
    const text = this.state.input.replace("https://", "http://");
    const uri = `https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=${encodeURIComponent(
      getQueryLocationOf(text)
    )}&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query`;
    const resp = await fetch(uri);
    if (resp.ok) {
      const data = (await resp.json()).results.bindings.map(
        b => b.Location.value
      );
      this.setState({
        state: null
      });
      if (data.length > 0) {
        this.props.onSelect(data[0]);
      }
    }
  };

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
        {this.state.state === "loading" ? "Loading..." : null}
      </div>
    );
  }
}