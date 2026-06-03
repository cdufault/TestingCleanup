import { DataSource, FeatureServiceDataSource, ImageServiceDataSource } from './DataSources';
import Field = __esri.Field;

/**
 * Defines the different statuses available for a rule.
 */
export enum RuleStatus {
    NotReady = 'Not Ready',
    Ready = 'Ready',
    Warning = 'Warning',
    Error = 'Error',
}

/**
 * Defines the different types of operations that a buffer rule supports.
 */
export enum BufferOperationType {
    Inside = 'Within',
    Outside = 'Beyond',
    None = '',
}

/**
 * Defines the different ways a buffer rule can define a rule constraint
 */
export enum BufferConstraintType {
    Number = 'number',
    Field = 'field',
}

/**
 * Defines the different types of operations that a rule supports.
 */
export enum ImageOperationType {
    Equal = '==',
    NotEqual = '!=',
    GreaterThan = '>',
    GreaterThanEqualTo = '>=',
    LessThan = '<',
    LessThanEqualTo = '<=',
    None = '',
}

/**
 * Represents the business logic state for a single rule
 * within a doctrinal template.
 */
export interface Rule {
    readonly id: number;
    enabled: boolean;
    alias: string;
    dataSource: DataSource;
    description: string;
    weight?: number;
    type: 'image' | 'buffer' | 'default';
}

/**
 * Extends the Rule interface with state information related to image service based rules.
 */
export interface ImageServiceRule extends Omit<Rule, 'dataSource'> {
    dataSource: ImageServiceDataSource;
    operation: ImageOperationType;
    constraint?: number;
}

/**
 * Extends the Rule interface with state information related to buffer rules.
 */
export interface BufferRule extends Omit<Rule, 'dataSource'> {
    dataSource: FeatureServiceDataSource;
    operation: BufferOperationType;
    constraintMode: BufferConstraintType;
    constraint?: number | Field;
}

/**
 * Provides information about the validation status of a Rule.
 */
export interface RuleValidationResult {
    status: RuleStatus;
    message: string;
}

export default Rule;
