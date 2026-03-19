namespace HxLabwrEd2.Model;

public class RackHole
{
	public Dimensions Dimensions { get; }

	public int Shape { get; }

	public RackHole(Container Container)
	{
		if (Container.ApertureShape == HxLabwrEd2.Model.Shape.Rectangle)
		{
			Shape = (int)Container.ApertureShape;
		}
		else
		{
			Shape = 0;
		}
		Dimensions = new Dimensions();
		if (Container.ApertureShape == HxLabwrEd2.Model.Shape.InvertedVCone || Container.ApertureShape == HxLabwrEd2.Model.Shape.VCone)
		{
			double num = ((Container.Dimensions.X >= Container.Dimensions.Y) ? Container.Dimensions.X : Container.Dimensions.Y);
			Dimensions = new Dimensions();
			Dimensions.X = num;
			Dimensions.Y = num;
			Dimensions.Z = Container.Dimensions.X;
		}
		else if (Container.ApertureShape == HxLabwrEd2.Model.Shape.Cylinder || Container.ApertureShape == HxLabwrEd2.Model.Shape.RoundBase || Container.ApertureShape == HxLabwrEd2.Model.Shape.VConeBase)
		{
			Dimensions = new Dimensions(Container.Dimensions.X, Container.Dimensions.X, Container.Dimensions.X);
		}
		else
		{
			Dimensions = new Dimensions(Container.Dimensions.X, Container.Dimensions.Y, (Container.Dimensions.X >= Container.Dimensions.Y) ? Container.Dimensions.X : Container.Dimensions.Y);
		}
	}

	public RackHole(double Diameter)
	{
		Dimensions = new Dimensions(0.0, 0.0, Diameter);
		Shape = 0;
	}
}
