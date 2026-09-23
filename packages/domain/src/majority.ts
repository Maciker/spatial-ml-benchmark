import { DomainError } from "./domain-error.js";

export type MajorityModel = {
  readonly kind: "majority";
  readonly label: 0 | 1;
};

export function fitMajority(labels: readonly number[]): MajorityModel {
  if (labels.length === 0) {
    throw DomainError.createValidation("Majority baseline requires training labels");
  }
  let zeros = 0;
  let ones = 0;
  for (const label of labels) {
    if (label === 0) zeros += 1;
    else if (label === 1) ones += 1;
    else throw DomainError.createValidation("Majority baseline only accepts classes 0 and 1");
  }
  return { kind: "majority", label: ones > zeros ? 1 : 0 };
}

export function predictMajority(model: MajorityModel, count: number): Array<0 | 1> {
  return Array.from({ length: count }, () => model.label);
}
