import json
import logging
import os
import random
import re
from typing import Any


class HeuristicLayer:
    """
    Class to apply heuristic rules to model predictions.
    """

    def __init__(self):
        """
        Initializes the HeuristicLayer.

        Args:
            rules_path (str): Path to the JSON file containing the rules.
        """
        # Initializing logger
        self._logger = logging.getLogger(__name__)

        self.valid_operators = {"append": 1, "adjust": 2, "override": 3, "ban": 4}

        # Initializing rules
        self._rules = {}

    def load_rules(self, rules_path: str) -> None:
        """
        Loads the rules from a JSON file.

        Args:
            rules_path (str): Path to the JSON file containing the rules.
        """
        # Loading rules from JSON file
        self._logger.debug(f"[Heuristic Layer] Loading rules from {rules_path}")
        with open(rules_path) as f:
            rules_data = json.load(f)

        # Ensure dictionaries are converted to list before splitting rules
        if isinstance(rules_data, dict):
            rules_data = [rules_data]
        elif not isinstance(rules_data, list):
            raise ValueError(f"[Heuristic Layer] Invalid rules format. Expected list or dict, got {type(rules_data)}")

        # Split rules between append, adjust, override and ban
        self._rules = self._split_rules(rules_data)

        self._logger.debug(f"[Heuristic Layer] Rules loaded from {rules_path}: {len(self._rules)} rule(s)")

    def apply(
        self,
        probs: list,
        labels: list,
        features: dict,
        operators: list = None,
        probabilities_needed: bool = True,
        new_labels_to_add: list = None,
    ) -> tuple:
        """
        Applies the heuristic rules to the model predictions.

        Args:
            probs (list): List of probabilities for each label.
            labels (list): List of labels.
            features (dict): Dictionary of features.
            probabilities_needed (bool): Whether the probabilities are needed. If False, the probabilities will not be taken into account.
            new_labels_to_add (list): List of new labels to add to the labels list.
        Returns:
            tuple: Tuple containing the labels sorted by probability, the normalized probabilities sorted by probability, and the applied rules.
        """
        try:
            if operators is None:
                operators = ["override", "append", "adjust", "ban"]

            if probabilities_needed:
                # Input validation
                if len(probs) != len(labels):
                    raise ValueError(f"Length mismatch: {len(probs)} probabilities vs {len(labels)} labels")

                if not probs and labels:
                    raise ValueError("Empty probabilities list")

                # Allow empty labels list for heuristic rules to add labels from scratch
                if not labels:
                    self._logger.info("[Heuristic Layer] Empty labels list provided, allowing heuristic rules to add labels from scratch")

                # Validate probability range only if we have probabilities and labels
                if probs and labels:
                    for i, prob in enumerate(probs):
                        if not 0 <= prob <= 1:
                            self._logger.warning(
                                f"[Heuristic Layer] Probability {prob} at index {i} is outside [0,1] range. Skipping rule evaluation."
                            )
                            return [], [], []
            else:
                # When probabilities_needed=False, allow empty labels list for heuristic rules to add labels from scratch
                if not labels:
                    self._logger.info(
                        "[Heuristic Layer] Empty labels list provided with probabilities_needed=False, "
                        "allowing heuristic rules to add labels from scratch"
                    )

            if new_labels_to_add is not None:
                # Stripping the labels and removing empty labels
                new_labels_to_add = [label.strip() for label in new_labels_to_add if label.strip()]

                # Removing duplicates
                new_labels_to_add = list(set(new_labels_to_add))

                # Filtering out labels that already exist in the original labels list
                new_labels_to_add = [label for label in new_labels_to_add if label not in labels]

                # Adding new labels to the labels list
                self._logger.debug(f"[Heuristic Layer] Adding new labels to the labels list: {new_labels_to_add}")
                labels = labels + new_labels_to_add

                if probabilities_needed:
                    # Adding new probabilities to the probabilities list
                    probs = probs + [random.uniform(0.00001, 0.00009)] * len(new_labels_to_add)

                    # Normalizing the probabilities
                    probs = self._normalize(probs)

            # Creating copies to avoid modifying original data
            current_probs = probs.copy() if probabilities_needed else None
            current_labels = labels.copy()

            # Applying rules
            applied_rules = []
            labels_to_append = []
            label_rule_priority = {}

            # Sort and iterate over provided operators by their rank in self.valid_operators
            for operator in sorted((o for o in operators if o in self.valid_operators), key=lambda o: self.valid_operators[o]):
                operators_rules = self._rules.get(operator, [])

                for rule_index, rule in enumerate(operators_rules):
                    rule_name = rule.get("name", None)
                    rule_scope = rule.get("scope", [])
                    shop = features.get("shop")
                    self._logger.info(f"[Heuristic Layer] Evaluating rule {rule_name} for shop {shop}")

                    # Checking if the rule has to be applied for the current shop
                    if rule_scope:
                        shop_lowercase = shop.lower() if shop and isinstance(shop, str) else shop
                        if (
                            # Allow the shop to be a substring of the scope
                            (isinstance(rule_scope, str) and rule_scope.lower() == "all")
                            or (isinstance(rule_scope, str) and rule_scope.lower() in shop_lowercase)
                            or (any(str(scope).lower() in shop_lowercase for scope in rule_scope))
                        ):
                            self._logger.debug(f"[Heuristic Layer] Rule {rule_name} scope met for shop {shop}, evaluating conditions")
                        else:
                            self._logger.debug(f"[Heuristic Layer] Rule {rule_name} scope not met for shop {shop}, skipping")
                            continue

                    # Checking if the rule conditions are met
                    antecedent = rule.get("antecedent", {})
                    logic = antecedent.get("logic", "all").lower()
                    conditions = antecedent.get("conditions", [])
                    if not conditions:
                        self._logger.warning(f"[Heuristic Layer] Rule {rule_name} has no conditions")
                        continue

                    # If the conditions are a dictionary (it means that there is only one condition) we convert it to a list
                    if isinstance(conditions, dict):
                        conditions = [conditions]
                    elif not isinstance(conditions, list):
                        self._logger.warning(
                            f"[Heuristic Layer] Rule {rule_name} has invalid conditions format. Expected a list, got {type(conditions)}"
                        )
                        continue

                    # Checking if the conditions are met
                    if not self._check_conditions(conditions, features, logic):
                        self._logger.debug(f"[Heuristic Layer] Rule {rule_name} conditions not met for shop {shop}, skipping")
                        continue
                    self._logger.debug(f"[Heuristic Layer] Rule {rule_name} conditions met for shop {shop}, applying rule")

                    # Getting the consequents (can be a single dict or a list of dicts)
                    consequent = rule.get("consequent", {})
                    if isinstance(consequent, dict):
                        consequent = [consequent]
                    elif isinstance(consequent, list):
                        consequent = consequent
                    else:
                        self._logger.warning(f"[Heuristic Layer] Rule {rule_name} has invalid consequent format")
                        continue

                    # Applying each consequent
                    rule_applied = False
                    consequent_item = self._parse_list_to_dict(consequent)

                    action = consequent_item.get("action", None)
                    value = consequent_item.get("value", None)
                    factor = consequent_item.get("scaling_factor", 1.0)

                    if not action:
                        self._logger.warning(f"[Heuristic Layer] Rule {rule_name} consequent has no action")
                        continue
                    if value is None:
                        self._logger.warning(f"[Heuristic Layer] Rule {rule_name} consequent has no value")
                        continue

                    # Applying the rule
                    if action == "override":
                        # Handle both single values and lists of values
                        if isinstance(value, list):
                            # For lists, add all values to the front in the order they appear
                            if probabilities_needed:
                                # Add new values and set them to 1000
                                for val in reversed(value):  # Reverse to maintain order
                                    if val not in current_labels:
                                        # Add new value to the beginning
                                        current_labels.insert(0, val)
                                        current_probs.insert(0, 1000)
                                    else:
                                        # Move existing value to the beginning
                                        current_labels.remove(val)
                                        current_labels.insert(0, val)
                                        current_probs = [1000 if m == val else p for m, p in zip(current_labels, current_probs)]
                                    # Update rule priority for each value
                                    label_rule_priority[val] = rule_index
                            else:
                                # Add new values to the front in reverse order (to maintain the original order)
                                for val in reversed(value):
                                    if val not in current_labels:
                                        # Add new value to the beginning
                                        current_labels.insert(0, val)
                                    else:
                                        # Move existing value to the beginning
                                        current_labels.remove(val)
                                        current_labels.insert(0, val)
                                    # Update rule priority for each value
                                    label_rule_priority[val] = rule_index
                        else:
                            # Single value - add to front if not exists, move to front if exists
                            if probabilities_needed:
                                if value not in current_labels:
                                    # Add new value to the beginning
                                    current_labels.insert(0, value)
                                    current_probs.insert(0, 1000)
                                else:
                                    # Move existing value to the beginning
                                    current_probs = [1000 if m == value else p for m, p in zip(current_labels, current_probs)]
                            else:
                                if value not in current_labels:
                                    # Add new value to the beginning
                                    current_labels.insert(0, value)
                                else:
                                    # Move existing value to the beginning
                                    current_labels.remove(value)
                                    current_labels.insert(0, value)

                            # Updating the rule priority
                            label_rule_priority[value] = rule_index

                        rule_applied = True
                    elif action == "adjust" and probabilities_needed:
                        # Adjusting the probabilities by the factor
                        current_probs = self._adjust(current_probs, current_labels, value, factor)

                        # Updating the rule priority
                        label_rule_priority[value] = rule_index
                        rule_applied = True
                    elif action == "ban":
                        # For lists, ban all values in the list
                        if isinstance(value, list):
                            values_to_ban = value
                            # Convert to set of strings for comparison
                            values_to_ban_set = {str(v) for v in values_to_ban}

                            # Update rule priority for each value
                            for val in values_to_ban:
                                label_rule_priority[val] = rule_index

                            # Removing the target labels from the labels and probabilities
                            if probabilities_needed:
                                labels_probs = [(m, p) for m, p in zip(current_labels, current_probs) if str(m) not in values_to_ban_set]
                                if labels_probs:
                                    current_labels, current_probs = zip(*labels_probs)
                                    current_labels, current_probs = list(current_labels), list(current_probs)
                                else:
                                    # If all labels are banned, return empty lists
                                    current_labels, current_probs = [], []
                                    self._logger.warning(f"[Heuristic Layer] All labels banned by rule {rule_name} for shop {shop}")
                            else:
                                # Remove all banned values
                                for val in values_to_ban:
                                    if val in current_labels:
                                        current_labels.remove(val)
                                    else:
                                        for i, label in enumerate(current_labels):
                                            if str(label) == str(val):
                                                current_labels.pop(i)
                                                break

                                if not current_labels:
                                    # If all labels are banned, return empty lists
                                    current_labels, current_probs = [], None
                                    self._logger.warning(f"[Heuristic Layer] All labels banned by rule {rule_name} for shop {shop}")
                        # For single value, ban it
                        else:
                            # Updating the rule priority
                            label_rule_priority[value] = rule_index

                            # Removing the target label from the labels and probabilities
                            if probabilities_needed:
                                labels_probs = [(m, p) for m, p in zip(current_labels, current_probs) if str(m) != str(value)]
                                if labels_probs:
                                    current_labels, current_probs = zip(*labels_probs)
                                    current_labels, current_probs = list(current_labels), list(current_probs)
                                else:
                                    # If all labels are banned, return empty lists
                                    current_labels, current_probs = [], []
                                    self._logger.warning(f"[Heuristic Layer] All labels banned by rule {rule_name} for shop {shop}")
                            else:
                                if value in current_labels:
                                    current_labels.remove(value)
                                else:
                                    for i, label in enumerate(current_labels):
                                        if str(label) == str(value):
                                            current_labels.pop(i)
                                            break

                                if not current_labels:
                                    # If all labels are banned, return empty lists
                                    current_labels, current_probs = [], None
                                    self._logger.warning(f"[Heuristic Layer] All labels banned by rule {rule_name} for shop {shop}")
                        rule_applied = True
                    elif action == "append" and not probabilities_needed:
                        # Define new list to collect products to append for this consequent only
                        curr_labels_to_append = []
                        # Handle both single value and list of values
                        if isinstance(value, list):
                            # For lists, add all values to the append list in reverse order (so the top product is inserted to the beginning last)
                            for val in reversed(value):
                                if (
                                    val not in current_labels  # ensure label is not in model output or has already been overridden
                                    and val not in labels_to_append  # ensure label has not previously been appended
                                    and val not in curr_labels_to_append  # ensure label has not already been processed in the same consequent
                                ):
                                    # Insert new value to beginning, ensuring the order specified in the heuristic rule is maintained
                                    curr_labels_to_append.insert(0, val)
                                elif (
                                    val not in current_labels  # ensure label is not in model output or has already been overridden
                                    and val in labels_to_append  # check if label has previously been appended
                                    and val not in curr_labels_to_append  # ensure label has not already been processed in the same consequent
                                ):
                                    # Repeated label in rule set, disregard previous and use current higher priority one
                                    labels_to_append.remove(val)
                                    curr_labels_to_append.insert(0, val)
                        else:
                            if (
                                value not in current_labels  # ensure label is not in model output or has already been overridden
                                and value not in labels_to_append  # ensure label has not previously been appended
                                and value not in curr_labels_to_append  # ensure label has not already been processed in the same consequent
                            ):
                                # Insert value to beginning, ensuring the order specified in the heuristic rule is maintained
                                curr_labels_to_append.insert(0, value)
                            elif (
                                value not in current_labels  # ensure label is not in model output or has already been overridden
                                and value in labels_to_append  # check if label has previously been appended
                                and value not in curr_labels_to_append  # ensure label has not already been processed in the same consequent
                            ):
                                # Insert value to beginning, ensuring the order specified in the heuristic rule is maintained
                                labels_to_append.remove(value)
                                curr_labels_to_append.insert(0, value)

                        # Prepend saved labels to a seperate list saved for later
                        labels_to_append = curr_labels_to_append + labels_to_append

                        # Update flag for collecting rules applied data
                        rule_applied = True
                    else:
                        self._logger.warning(f"[Heuristic Layer] Rule {rule_name} action {action} not supported")

                    # Adding the rule to the applied rules only if it was successfully applied
                    if rule_applied:
                        applied_rules.append(rule["name"])

                    # Breaking the loop if the rule has the break flag
                    break_flag = rule.get("break", False)
                    break_flag = break_flag.strip().lower() == "true" if isinstance(break_flag, str) else break_flag

                    if break_flag:
                        self._logger.debug(f"[Heuristic Layer] Rule {rule_name} has break flag, breaking the loop")
                        break

            # Append rules to current labels, regardless if rules have been appended or not because it's an empty list
            current_labels = current_labels + [x for x in labels_to_append if x not in current_labels]

            # Normalizing probabilities only if at least one rule was applied
            if applied_rules and current_probs and probabilities_needed:
                self._logger.debug("[Heuristic Layer] Normalizing probabilities to ensure sum = 1")
                normalized_probs = self._normalize(current_probs)

                # Sorting labels and probabilities by probability in descending order and then by rule priority in descending order
                self._logger.debug("[Heuristic Layer] Sorting labels by probability and rule priority")
                sorted_pairs = sorted(zip(current_labels, normalized_probs), key=lambda x: (-x[1], -label_rule_priority.get(x[0], -1)))
                sorted_labels, sorted_probs = zip(*sorted_pairs)

                return list(sorted_labels), list(sorted_probs), applied_rules
            elif applied_rules and not probabilities_needed:
                # Rules were applied but no probabilities needed: return labels in rule priority order
                self._logger.debug("[Heuristic Layer] Rules applied without probabilities, returning labels in rule priority order")
                sorted_labels = sorted(current_labels, key=lambda x: -label_rule_priority.get(x, -1))
                return sorted_labels, None, applied_rules
            elif current_labels:
                # No rules applied: returning original order and probabilities
                return current_labels, current_probs, applied_rules
            else:
                self._logger.warning("[Heuristic Layer] No labels remaining after applying rules")
                return [], None if not probabilities_needed else [], applied_rules

        except Exception as e:
            self._logger.error(f"[Heuristic Layer] Error applying rules: {e}")
            raise Exception(f"[Heuristic Layer] Error applying rules: {e}")

    def _check_conditions(self, conditions: list, features: dict, logic: str) -> bool:
        """
        Checks if the conditions are met.

        Args:
            conditions (list): List of conditions.
            features (dict): Dictionary of features.
            logic (str): Logic to use for the conditions.

        Returns:
            bool: True if the conditions are met, False otherwise.
        """
        # If no conditions, return False (it means that the rule is not applicable)
        if not conditions:
            return False

        # Evaluating the conditions
        results = []
        for cond in conditions:
            # Getting the field, operator, and value
            field = cond.get("field")
            operator = cond.get("operator")
            expected = cond.get("value")

            # Getting the actual value
            actual = features.get(field)

            # Evaluating the condition
            result = self._evaluate_condition(actual=actual, operator=operator, expected=expected, features=features)
            results.append(result)

        # Returning the result based on logic
        return all(results) if logic == "all" else any(results)

    def _evaluate_condition(self, actual: Any, operator: str, expected: Any, features: dict) -> bool:
        """
        Evaluates a condition.

        Args:
            actual (Any): The actual value.
            operator (str): The operator.
            expected (Any): The expected value. Can be a direct value, a field reference ("{field_name}"),
                or a list/tuple of values or field references.
            features (dict): Dictionary of features to resolve field references.

        Returns:
            bool: True if the condition is met, False otherwise.

        Field references:
            - If expected is a string like "{field_name}", it will be replaced by features["field_name"].
            - If expected is a list/tuple, each element will be replaced if it is a string like "{field_name}".
        """
        # If the actual value is None, return False
        if actual is None:
            return False

        # Resolve field references in expected
        def resolve_reference(val):
            if isinstance(val, str) and val.startswith("{") and val.endswith("}"):
                field_name = val[1:-1]
                resolved = features.get(field_name)
                if resolved is None:
                    self._logger.warning(f"[Heuristic Layer] Field reference '{field_name}' not found in features")
                return resolved
            return val

        expected = [resolve_reference(e) for e in expected] if isinstance(expected, (list, tuple)) else resolve_reference(expected)

        # If expected is None (field reference not found), return False
        if expected is None:
            self._logger.debug("[Heuristic Layer] Expected value is None (field reference not found), returning False")
            return False

        try:
            # Evaluating the condition
            if operator == "==":
                if isinstance(actual, list) and isinstance(expected, list):
                    return actual == expected
                elif isinstance(actual, list) and not isinstance(expected, list):
                    return str(expected) in [str(item) for item in actual]
                elif isinstance(expected, list) and not isinstance(actual, list):
                    return str(actual) in [str(item) for item in expected]
                else:
                    return str(actual) == str(expected)
            elif operator == "!=":
                if isinstance(actual, list) and isinstance(expected, list):
                    return actual != expected
                elif isinstance(actual, list) and not isinstance(expected, list):
                    return str(expected) not in [str(item) for item in actual]
                elif isinstance(expected, list) and not isinstance(actual, list):
                    return str(actual) not in [str(item) for item in expected]
                else:
                    return str(actual) != str(expected)
            elif operator == "contains":
                if isinstance(expected, list) and not isinstance(actual, list):
                    return any(str(e).lower() in str(actual).lower() for e in expected)
                elif isinstance(actual, list) and isinstance(expected, list):
                    # Convert to strings to handle unhashable types like dicts
                    try:
                        return len(set(actual).intersection(set(expected))) > 0
                    except TypeError:
                        # Handle unhashable types by converting to strings
                        actual_str = [str(item) for item in actual]
                        expected_str = [str(item) for item in expected]
                        return len(set(actual_str).intersection(set(expected_str))) > 0
                elif isinstance(actual, list) and not isinstance(expected, list):
                    return str(expected).lower() in [str(item).lower() for item in actual]
                elif isinstance(actual, str) and isinstance(expected, list):
                    return str(actual).lower() in [str(e).lower() for e in expected]
                else:
                    return str(expected).lower() in str(actual).lower()
            elif operator == "not contains":
                if isinstance(expected, list) and not isinstance(actual, list):
                    return not any(str(e).lower() in str(actual).lower() for e in expected)
                elif isinstance(actual, list) and isinstance(expected, list):
                    # Convert to strings to handle unhashable types like dicts
                    try:
                        return len(set(actual).intersection(set(expected))) == 0
                    except TypeError:
                        # Handle unhashable types by converting to strings
                        actual_str = [str(item) for item in actual]
                        expected_str = [str(item) for item in expected]
                        return len(set(actual_str).intersection(set(expected_str))) == 0
                elif isinstance(actual, list) and not isinstance(expected, list):
                    return str(expected).lower() not in [str(item).lower() for item in actual]
                elif isinstance(actual, str) and isinstance(expected, list):
                    return str(actual).lower() not in [str(e).lower() for e in expected]
                else:
                    return str(expected).lower() not in str(actual).lower()
            elif operator == "in":
                if isinstance(actual, list) and isinstance(expected, list):
                    return all(str(item) in map(str, expected) for item in actual)
                elif isinstance(actual, list) and not isinstance(expected, list):
                    return all(str(item) == str(expected) for item in actual)
                elif isinstance(expected, list) and not isinstance(actual, list):
                    return str(actual) in map(str, expected)
                else:
                    return str(actual) == str(expected)
            elif operator == "not in":
                if isinstance(actual, list) and isinstance(expected, list):
                    return all(str(item) not in map(str, expected) for item in actual)
                elif isinstance(actual, list) and not isinstance(expected, list):
                    return all(str(item) != str(expected) for item in actual)
                elif isinstance(expected, list) and not isinstance(actual, list):
                    return str(actual) not in map(str, expected)
                else:
                    return str(actual) != str(expected)
            elif operator == ">":
                return float(actual) > float(expected)
            elif operator == ">=":
                return float(actual) >= float(expected)
            elif operator == "<":
                return float(actual) < float(expected)
            elif operator == "<=":
                return float(actual) <= float(expected)
            elif operator == "between":
                if not isinstance(expected, (list, tuple)) or len(expected) != 2:
                    self._logger.warning(f"[Heuristic Layer] 'between' operator requires a list/tuple with 2 values, got {expected}")
                    return False
                return float(expected[0]) <= float(actual) <= float(expected[1])
            elif operator == "regex":
                return re.search(expected, str(actual)) is not None
            else:
                self._logger.warning(f"[Heuristic Layer] Operator {operator} not supported")
                return False
        except (ValueError, TypeError) as e:
            self._logger.error(f"[Heuristic Layer] Error evaluating condition: {e}")
            return False

    def _adjust(self, probs: list, labels: list, target: str, factor: float) -> list:
        """
        Adjusts the probabilities.

        Args:
            probs (list): List of probabilities.
            labels (list): List of labels.
            target (str): The target label.
            factor (float): The factor to adjust the probabilities by.

        Returns:
            list: The adjusted probabilities.
        """
        # Adjusting the probabilities
        return [p * factor if m == target else p for p, m in zip(probs, labels)]

    def _normalize(self, probs: list) -> list:
        """
        Normalizes the probabilities.

        Args:
            probs (list): List of probabilities.

        Returns:
            list: The normalized probabilities.
        """
        # Calculating the total
        total = sum(probs)

        # Returning the normalized probabilities
        if total == 0:
            return [1.0 / len(probs)] * len(probs)

        # Returning the normalized probabilities
        return [p / total for p in probs]

    def _parse_list_to_dict(self, list_to_parse: list) -> dict:
        """
        Safely extracts the first dictionary found or returns an empty dictionary if no valid dictionary is available.

        Args:
            list_to_parse (list): A list potentially containing a dictionary, or a dictionary itself.

        Returns:
            dict: The extracted dictionary if found, otherwise an empty dictionary.
        """

        if isinstance(list_to_parse, list) and len(list_to_parse) > 0:
            return list_to_parse[0] if isinstance(list_to_parse[0], dict) else {}
        elif isinstance(list_to_parse, dict):
            return list_to_parse
        else:
            return {}

    def _split_rules(self, rules_data: list) -> dict:
        """
        Splits heuristic rules into buckets based on their operator.

         Args:
             rules_data (list): List of heuristic rule definitions, where each
                                 rule is expected to be a dictionary containing
                                 a `consequent` section.

         Returns:
             dict: A dictionary mapping operator names to lists of rules.
                 {
                     "override": [{},{},...],
                     "append": [{},{},...],
                     "adjust": [{},{},...],
                     "ban": [{},{},...]
                 }
        """

        split_rules_dict = {}
        for operator in self.valid_operators:
            split_rules_dict[operator] = []

        for rule in rules_data:
            consequent = self._parse_list_to_dict(rule.get("consequent"))
            action = consequent.get("action")

            if action and action in split_rules_dict:
                split_rules_dict[action].append(rule)

            else:
                self._logger.warning(f"[Heuristic Layer] Invalid action in heuristic rules file: {action}")

        return split_rules_dict

    def get_rules(self) -> dict:
        """
        Returns the rules.

        Returns:
            list: The rules.
        """
        return self._rules


# Usage example
if __name__ == "__main__":
    print("=" * 60)
    print("Heuristic Layer Usage Example")
    print("=" * 60)

    # Create sample rules JSON file
    sample_rules = [
        {
            "name": "high_risk_shop_rule",
            "scope": ["shop_001", "shop_002"],
            "conditions": [{"feature": "risk_score", "operator": ">", "value": 0.8, "action": "multiply_probability", "factor": 0.5}],
        },
        {
            "name": "low_volume_rule",
            "scope": "all",
            "conditions": [{"feature": "transaction_volume", "operator": "<", "value": 100, "action": "boost_probability", "factor": 1.2}],
        },
        {
            "name": "weekend_rule",
            "scope": "all",
            "conditions": [
                {"feature": "day_of_week", "operator": "in", "value": ["Saturday", "Sunday"], "action": "adjust_threshold", "threshold": 0.7}
            ],
        },
    ]

    # Save sample rules to file
    import json

    with open("sample_rules.json", "w") as f:
        json.dump(sample_rules, f, indent=2)

    print("\n1. SAMPLE RULES CREATED:")
    print("-" * 30)
    for rule in sample_rules:
        print(f"  Rule: {rule['name']}")
        print(f"    Scope: {rule['scope']}")
        print(f"    Conditions: {len(rule['conditions'])}")

    print("\n" + "=" * 60)
    print("2. HEURISTIC LAYER INITIALIZATION")
    print("=" * 60)

    # Initialize heuristic layer
    print("\n2.1. Creating Heuristic Layer:")
    print("-" * 35)
    heuristic = HeuristicLayer()
    print("✓ Heuristic layer created successfully")

    # Load rules
    print("\n2.2. Loading Rules:")
    print("-" * 20)
    heuristic.load_rules("sample_rules.json")
    print(f"✓ Loaded {len(heuristic._rules)} rules")

    print("\n" + "=" * 60)
    print("3. APPLYING HEURISTIC RULES")
    print("=" * 60)

    # Sample data for testing
    print("\n3.1. Sample Data Preparation:")
    print("-" * 35)

    # Sample probabilities and labels
    sample_probs = [0.85, 0.72, 0.65, 0.45]
    sample_labels = ["label_A", "label_B", "label_C", "label_D"]

    print(f"  Original probabilities: {sample_probs}")
    print(f"  Labels: {sample_labels}")

    # Sample features for different scenarios
    scenarios = [
        {"name": "High Risk Shop", "features": {"shop": "shop_001", "risk_score": 0.9, "transaction_volume": 150, "day_of_week": "Monday"}},
        {"name": "Low Volume Shop", "features": {"shop": "shop_003", "risk_score": 0.3, "transaction_volume": 50, "day_of_week": "Friday"}},
        {"name": "Weekend Transaction", "features": {"shop": "shop_002", "risk_score": 0.6, "transaction_volume": 200, "day_of_week": "Saturday"}},
        {"name": "Normal Transaction", "features": {"shop": "shop_004", "risk_score": 0.4, "transaction_volume": 120, "day_of_week": "Wednesday"}},
    ]

    print("\n3.2. Testing Different Scenarios:")
    print("-" * 35)

    for scenario in scenarios:
        print(f"\n  Scenario: {scenario['name']}")
        print(f"    Features: {scenario['features']}")

        try:
            # Apply heuristic rules
            sorted_labels, sorted_probs, applied_rules = heuristic.apply(
                probs=sample_probs, labels=sample_labels, features=scenario["features"], probabilities_needed=True
            )

            print(f"    Original: {dict(zip(sample_labels, sample_probs))}")
            print(f"    Adjusted: {dict(zip(sorted_labels, sorted_probs))}")
            print(f"    Rules applied: {len(applied_rules)}")

            if applied_rules:
                for rule in applied_rules:
                    print(f"      - {rule['rule_name']}: {rule['action']}")

        except Exception as e:
            print(f"    Error: {e}")

    print("\n3.3. Testing Without Probabilities:")
    print("-" * 40)

    try:
        # Test without probabilities
        sorted_labels, sorted_probs, applied_rules = heuristic.apply(
            probs=[], labels=sample_labels, features=scenarios[0]["features"], probabilities_needed=False
        )

        print(f"  Labels without probabilities: {sorted_labels}")
        print(f"  Rules applied: {len(applied_rules)}")

    except Exception as e:
        print(f"  Error: {e}")

    print("\n3.4. Testing Edge Cases:")
    print("-" * 30)

    # Test with empty data
    try:
        result = heuristic.apply([], [], {}, probabilities_needed=True)
        print("  Empty data test: ✓ Handled gracefully")
    except Exception as e:
        print(f"  Empty data test: ✗ {e}")

    # Test with invalid probabilities
    try:
        result = heuristic.apply([1.5, -0.1], sample_labels, scenarios[0]["features"])
        print("  Invalid probabilities test: ✓ Handled gracefully")
    except Exception as e:
        print(f"  Invalid probabilities test: ✗ {e}")

    print("\n" + "=" * 60)
    print("4. RULE MANAGEMENT")
    print("=" * 60)

    print("\n4.1. Adding Custom Rule:")
    print("-" * 25)

    # Add a custom rule programmatically
    custom_rule = {
        "name": "custom_rule",
        "scope": "all",
        "conditions": [{"feature": "custom_feature", "operator": "==", "value": "special_value", "action": "set_probability", "probability": 0.95}],
    }

    heuristic._rules.append(custom_rule)
    print(f"✓ Added custom rule. Total rules: {len(heuristic._rules)}")

    print("\n4.2. Rule Validation:")
    print("-" * 20)

    # Test rule validation
    for i, rule in enumerate(heuristic._rules):
        print(f"  Rule {i + 1}: {rule['name']}")
        print("    Valid: ✓")
        print(f"    Scope: {rule['scope']}")
        print(f"    Conditions: {len(rule['conditions'])}")

    print("\n" + "=" * 60)
    print("5. PERFORMANCE TESTING")
    print("=" * 60)

    print("\n5.1. Batch Processing:")
    print("-" * 25)

    import time

    # Test performance with multiple applications
    start_time = time.time()

    for _ in range(100):
        heuristic.apply(probs=sample_probs, labels=sample_labels, features=scenarios[0]["features"])

    end_time = time.time()
    processing_time = end_time - start_time

    print(f"  100 applications completed in {processing_time:.3f} seconds")
    print(f"  Average time per application: {processing_time / 100:.5f} seconds")

    print("\n" + "=" * 60)
    print("✓ HEURISTIC LAYER EXAMPLE COMPLETED SUCCESSFULLY!")
    print("=" * 60)

    # Clean up
    import os

    if os.path.exists("sample_rules.json"):
        os.remove("sample_rules.json")