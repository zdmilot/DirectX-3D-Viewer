namespace HxLabwrEd2.Model;

public class PedestalMessage
{
	public int Position { get; }

	public string ModelFilePath { get; }

	public bool LoadModels { get; }

	public PedestalMessage(int position, string modelFilePath, bool loadModels = true)
	{
		Position = position;
		ModelFilePath = modelFilePath;
		LoadModels = loadModels;
	}
}
