import { Triumph } from './Triumph';

export class PresentationNode {
  displayProperties: DisplayProperties;
  rootViewIcon: string;
  scope: number;
  children: Children;
  objectiveHash: string;
  parentNodeHashes: Array<string>;
  hash: string;
}


export class DisplayProperties {
  description: string;
  name: string;
  icon: string;
  hasIcon: boolean;
}

export class Children {
  presentationNodes: Array<PresentationNode>;
  records: Array<Triumph>;
}
