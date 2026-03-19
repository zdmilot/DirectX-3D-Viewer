using System;
using System.Globalization;
using System.Windows.Controls;

namespace HxLabwrEd2.Validation;

public class CategoryNameValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (string.IsNullOrWhiteSpace(Convert.ToString(value)))
		{
			return new ValidationResult(isValid: false, "Category name cannot be empty!");
		}
		return new ValidationResult(isValid: true, null);
	}
}
