import * as React from "react";
import IntersectionObserver from "@researchgate/react-intersection-observer";
import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  from {
    background: crimson;
  }

  to {
    background: salmon;
  }
`;

const ImagePlaceholder = styled.div`
  background: crimson;
  width: ${props => props.width}px;
  height: ${props => props.height}px;
`;

const LoadingImagePlaceholder = styled(ImagePlaceholder)`
  animation: ${pulse} 2s linear infinite alternate-reverse;
`;

function fetchImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = src || "";
  });
}

type Props = {
  width: number;
  alt: string;
  height: number;
  src: string;
  fallback: React.ReactNode;
  style?: { [name: string]: any };
  onClick?: () => void;
  onLoad?: () => void;
};

enum ImageFetchState {
  initial,
  loading,
  failed,
  done
}

type State = {
  imageFetchState: ImageFetchState;
};

export default class LazyImage extends React.Component<Props, State> {
  state = {
    imageFetchState: ImageFetchState.initial
  };

  loadImage: () => Promise<void> = () => {
    this.setState({
      imageFetchState: ImageFetchState.loading
    });
    return fetchImage(this.props.src)
      .then(() => {
        this.setState({
          imageFetchState: ImageFetchState.done
        });
      })
      .catch(() =>
        this.setState({
          imageFetchState: ImageFetchState.failed
        })
      );
  };

  handleIntersection = (event: IntersectionObserverEntry) => {
    if (
      event.isIntersecting &&
      this.state.imageFetchState !== ImageFetchState.done
    ) {
      this.loadImage().then(
        () => typeof this.props.onLoad === "function" && this.props.onLoad()
      );
    }
  };

  render() {
    const { src, onClick } = this.props;
    if (!this.props.src) {
      return this.props.fallback;
    }
    return (
      <React.Fragment>
        {
          {
            [ImageFetchState.initial]: (
              <IntersectionObserver
                rootMargin={`${180 * 2}px`}
                onChange={this.handleIntersection}
              >
                <LoadingImagePlaceholder
                  width={this.props.width}
                  height={this.props.height}
                  onClick={onClick}
                />
              </IntersectionObserver>
            ),
            [ImageFetchState.loading]: (
              <LoadingImagePlaceholder
                width={this.props.width}
                height={this.props.height}
                onClick={onClick}
              />
            ),
            [ImageFetchState.failed]: (
              <ImagePlaceholder {...this.props}>
                Failed to load
              </ImagePlaceholder>
            ),
            [ImageFetchState.done]: <img {...this.props} />
          }[this.state.imageFetchState]
        }
      </React.Fragment>
    );
  }
}
