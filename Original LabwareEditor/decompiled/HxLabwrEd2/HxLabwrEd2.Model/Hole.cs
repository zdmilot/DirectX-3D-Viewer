namespace HxLabwrEd2.Model;

public class Hole
{
	public Shape Shape { get; set; }

	public Dimensions Dimensions { get; set; }

	public Hole()
	{
		Dimensions = new Dimensions();
	}

	public Hole(Hole hole)
	{
		Shape = hole.Shape;
		Dimensions = new Dimensions(hole.Dimensions);
	}
}
