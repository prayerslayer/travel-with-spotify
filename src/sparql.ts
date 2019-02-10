import uniq from "lodash-es/uniqBy";
import { Artist, Track, ArtistWithTracks } from "./spotify";

export type Location = {
  uri: string;
  name: string;
};

export function getQueryLocationOf(wikipage: string) {
  return `SELECT DISTINCT ?Location, ?Name WHERE {
    ?Location foaf:isPrimaryTopicOf <${wikipage}> .
    OPTIONAL {
      ?Location foaf:name ?Name .
      FILTER langMatches ( lang(?Name), "EN" )
    }
  }
  LIMIT 1`;
}

// TODO also check for dbo:country
// Behemoth is not in Poland list because Gdansk has no isPartOf relationship up to Poland
// And what about dbo:part
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

type ResultVariable = {
  type: "uri" | "literal";
  value: string;
};
type BandBinding = {
  Band: ResultVariable;
  Name: ResultVariable;
};
export async function getBandsFromLocation(location: Location) {
  const bandQuery = getQueryBandsIn(location.uri);
  const uri = `https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query=${encodeURIComponent(
    bandQuery
  )}&format=application%2Fsparql-results%2Bjson&CXML_redir_for_subjs=121&CXML_redir_for_hrefs=&timeout=30000&debug=on&run=+Run+Query`;
  const resp = await fetch(uri);
  const data = await resp.json();
  const bindingToArtists: Artist[] = (data.results.bindings as BandBinding[])
    .filter(
      // Weirdly, the "List of KMFDM members" page shares a lot of the data with the KMFDM page
      // So we filter this out because what the fuck
      b => !b.Band.value.startsWith("http://dbpedia.org/resource/List_of_")
    )
    .map(b => ({
      name: b.Name.value,
      type: "artist" as "artist",
      id: b.Band.value,
      images: [],
      genres: [],
      popularity: 0,
      followers: { total: 0 }
    }));
  return uniq<Artist>(bindingToArtists, artist => artist.id).map(
    (artist: Artist) => ({
      artist,
      tracks: [] as Track[]
    })
  );
}
