using System.Globalization;
using System.Linq;
using System.Windows.Controls;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.Validation;

public class DataGridRackWellLabelColumnValidation : ValidationRule
{
	public DependencyObjectWrapper WrappedRectangularRack { get; set; }

	public DependencyObjectWrapper WrappedSelectedRackWell { get; set; }

	public override ValidationResult Validate(object value, CultureInfo cultureInfo)
	{
		string newLabel = value.ToString();
		if (string.IsNullOrEmpty(newLabel))
		{
			return new ValidationResult(isValid: false, "Well Label cannot be blank.");
		}
		if (WrappedRectangularRack != null && WrappedRectangularRack.WrappedObject != null)
		{
			if ((WrappedRectangularRack.WrappedObject as RectangularRack).RackWells.Count((RackWell rackWell) => rackWell.Label == newLabel) > 0 && WrappedSelectedRackWell?.WrappedObject != null && (WrappedSelectedRackWell.WrappedObject as RackWell).Label != newLabel)
			{
				return new ValidationResult(isValid: false, "Well Label must be unique.");
			}
			newLabel = newLabel.Replace("_", string.Empty);
			if (!newLabel.All(char.IsLetterOrDigit))
			{
				return new ValidationResult(isValid: false, "Well Label must only contain alphanumeric and underscore characters.");
			}
		}
		return new ValidationResult(isValid: true, null);
	}
}
