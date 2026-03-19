namespace HxLabwrEd2.Model;

public class DrawContainer
{
	public string FilePath { get; set; }

	public string RelativeFilePath { get; set; }

	public Dimensions Dimensions { get; set; }

	public Shape Shape { get; set; }

	public AssignedLabwareStatus Status { get; set; }

	public FileOpeningStatus FileStatus { get; set; }

	public string FileStatusError { get; set; }

	public DrawContainer(DrawContainer drawContainer)
	{
		RelativeFilePath = drawContainer.RelativeFilePath;
		Dimensions = drawContainer.Dimensions;
		Shape = drawContainer.Shape;
		Status = drawContainer.Status;
		FileStatus = drawContainer.FileStatus;
		FileStatusError = drawContainer.FileStatusError;
	}

	public DrawContainer(string FilePath, string RelativeFilePath)
	{
		Status = AssignedLabwareStatus.NotFound;
		this.FilePath = FilePath;
		this.RelativeFilePath = RelativeFilePath;
		Dimensions = new Dimensions();
		FileStatus = FileOpeningStatus.SuccessfullyOpened;
	}

	public DrawContainer(string FilePath, string RelativeFilePath, AssignedLabwareStatus Status)
	{
		this.Status = Status;
		this.FilePath = FilePath;
		this.RelativeFilePath = RelativeFilePath;
		Dimensions = new Dimensions();
		FileStatus = FileOpeningStatus.SuccessfullyOpened;
	}
}
