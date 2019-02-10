import styled from "styled-components";
import * as React from "react";

export const Page = styled.section`
  width: 100vw;
  height: 100vh;
  display: flex;
`;

export const CenteredInPage = styled(Page)`
  align-items: center;
  justify-content: center;
`;

export const Row = styled.section`
  display: flex;
  flex-direction: row;
`;

export const Col = styled.section`
  display: flex;
  flex-direction: column;
`;

export const Button = styled.button`
  background: inherit;
  border: 2px solid black;
  cursor: pointer;
  color: black;
  padding: 0.25em 1em 0.35em 1em;

  :hover {
    color: whitesmoke;
    border-color: whitesmoke;
  }
`;

export const PrimaryButton = styled(Button)`
  background: black;
  color: white;
`;

export const MediumButton = styled(Button)`
  font-size: 1.25rem;
`;

export const MediumPrimaryButton = styled(PrimaryButton)`
  font-size: 1.25rem;
`;

export const LargeButton = styled(Button)`
  font-size: 2rem;
`;

export const H3 = styled.h3`
  margin-top: 0;
  margin-bottom: 0;
  font-size: 1.25rem;
`;

export const Heading = styled.h3`
  margin-bottom: 25px;
`;

export const Paragraph = styled.p`
  max-width: 600px;
  margin-top: 0;
  margin-bottom: 0;

  + p {
    margin-top: 10px;
  }
`;

export const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, 180px);
  grid-gap: 10px 10px;
  justify-items: center;
  justify-content: center;
  align-items: start;
  align-content: center;
`;

export const SpanningRow = styled.section`
  grid-column: 1 / span 4;
`;

export const LargeInput = styled.input`
  font-size: 1.25rem;
  width: 100%;
  margin: 5px;
`;

const OkayMessage = styled.p`
  background: forestgreen;
  color: white;
  padding: 25px;
  text-align: center;
  margin-bottom: 10px;
`;

const ErrorMessage = styled(OkayMessage)`
  color: black;
  background: yellow;
`;

export const Alert: React.FunctionComponent<{
  dismissable?: boolean;
  type?: "success" | "error";
}> = function({ dismissable = false, children, type }) {
  const [show, toggle] = React.useState(true);
  if (dismissable && !show) {
    return null;
  }
  const Component = type === "success" ? OkayMessage : ErrorMessage;
  return (
    <div>
      <Component>{children}</Component>
      {dismissable && <Button onClick={() => toggle(false)}>Okay</Button>}
    </div>
  );
};
