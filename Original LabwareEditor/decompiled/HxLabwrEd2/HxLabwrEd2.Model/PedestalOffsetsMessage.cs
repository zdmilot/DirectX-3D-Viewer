namespace HxLabwrEd2.Model;

public class PedestalOffsetsMessage
{
	public int Position { get; }

	public float XOffsetOverride { get; }

	public float YOffsetOverride { get; }

	public PedestalOffsetsMessage(int position, float xOffset, float yOffset)
	{
		Position = position;
		XOffsetOverride = xOffset;
		YOffsetOverride = yOffset;
	}
}
