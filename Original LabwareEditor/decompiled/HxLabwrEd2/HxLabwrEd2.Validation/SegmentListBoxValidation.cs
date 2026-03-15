using System.Globalization;
using System.Windows.Controls;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Validation;

public class SegmentListBoxValidation : ValidationRule
{
	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		if (value != null && (value as TrulyObservableCollection<ContainerSegment>).Count == 0)
		{
			return new ValidationResult(isValid: false, "Provided value is not a number.");
		}
		return new ValidationResult(isValid: true, null);
	}
}
