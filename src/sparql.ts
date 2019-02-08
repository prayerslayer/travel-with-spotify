export type Location = {
  uri: string;
  name: string;
  abstract: string;
  image?: string;
};

export function getQueryLocationOf(wikipage: string) {
  return `SELECT DISTINCT ?Location, ?Name, ?Abstract, ?Image WHERE {
    ?Location foaf:isPrimaryTopicOf <${wikipage}> .
    ?Location dbo:abstract ?Abstract .
    OPTIONAL {
      ?Location foaf:name ?Name .
      FILTER langMatches ( lang(?Name), "EN" )
    }
    OPTIONAL {
      ?Location dbo:thumbnail ?Image
    }
    FILTER langMatches( lang(?Abstract), "EN" )
  }
  LIMIT 1`;
}

export function getQueryBandsIn(locationURI: string) {
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
