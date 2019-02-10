import styled from "styled-components";

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

export const MediumButton = styled(Button)`
  font-size: 1.25rem;
`;

export const LargeButton = styled(Button)`
  font-size: 2rem;
`;

export const Heading = styled.h3`
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.25rem;
`;

export const Paragraph = styled.p`
  max-width: 600px;
  margin-top: 0;
  margin-bottom: 0;

  + p {
    margin-top: 10px;
  }
`;

export const LargeInput = styled.input`
  font-size: 1.25rem;
  width: 100%;
  margin: 5px;
`;
