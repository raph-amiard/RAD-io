import string

VALID_CHARS = frozenset('-_.(){0}{1} '.format(string.ascii_letters,
											  string.digits))

def sanitize_filename(f):
	"""
	Sanitizes a filename, retaining only the characters in valid_chars
	and transforming every whitespace into underscores
	"""
	return ''.join([c for c in f if c in VALID_CHARS]).replace(' ', '_')

def sanitize_filestring(str):
    """
    Sanitizes a string supposed to go in a filename
    """
    return sanitize_filename(str.strip())
