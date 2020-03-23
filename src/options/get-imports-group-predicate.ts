import * as resolve from 'resolve';
import * as path from 'path';
import { SourceFile, ImportDeclaration } from 'typescript';

import {
  MatchingRuleConfig,
  ImportsGroupType,
  DependenciesMatchingRuleConfig,
  ProjectMatchingRuleConfig
} from './types';
import { Predicate } from '../nodes-containers';
import {
  getNodeJsModulesRegExps,
  getNodeModulesRegExps,
  getPackageJsonDependenciesRegExps
} from '../utils/get-dependencies-reg-exps';
import { removeQuotes } from '../utils/remove-quotes';

export function getImportsGroupPredicate(
  sourceFile: SourceFile,
  matchingRuleConfig: MatchingRuleConfig
): Predicate<ImportDeclaration> {
  if (matchingRuleConfig.type === ImportsGroupType.Dependencies) {
    return getDependenciesImportsGroupPredicate(sourceFile, matchingRuleConfig);
  }

  return getProjectImportsGroupPredicate(sourceFile, matchingRuleConfig);
}

const getProjectImportsGroupPredicate = (
  sourceFile: SourceFile,
  matchingRuleConfig: ProjectMatchingRuleConfig
) => {
  return importDeclarationMatchesRegExpsFactory(
    sourceFile,
    [
      new RegExp(matchingRuleConfig.matches)
    ],
    matchingRuleConfig
  );
}

function getDependenciesImportsGroupPredicate(
  sourceFile: SourceFile,
  matchingRuleConfig: DependenciesMatchingRuleConfig
) {
  const regExps = matchingRuleConfig['from-package.json']
    ? getPackageJsonDependenciesRegExps()
    : getNodeModulesRegExps();

  if (!matchingRuleConfig['disable-native-nodejs-modules']) {
    regExps.push(...getNodeJsModulesRegExps());
  }

  return importDeclarationMatchesRegExpsFactory(sourceFile, regExps, matchingRuleConfig);
}

const importDeclarationMatchesRegExpsFactory = (
  sourceFile: SourceFile,
  regExps: RegExp[],
  matchingRuleConfig: DependenciesMatchingRuleConfig|ProjectMatchingRuleConfig
): Predicate<ImportDeclaration> => (node) => {
  let moduleSpecifier = getModuleSpecifier(sourceFile, node);
  if (matchingRuleConfig.absolute) {
    const baseDirectory = path.dirname(path.resolve(sourceFile.fileName));
    try {
      moduleSpecifier = resolve.sync(
        moduleSpecifier,
        {
          basedir: baseDirectory,
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
        }
      );
    } catch (e) {
      if (e && e.code === 'MODULE_NOT_FOUND') {
        console.log(e.message);
      } else {
        console.error(e);
      }
    }
  }
  return regExps.some(regExp => regExp.test(moduleSpecifier));
}

function getModuleSpecifier(sourceFile: SourceFile, node: ImportDeclaration) {
  return removeQuotes(node.moduleSpecifier.getText(sourceFile));
}
