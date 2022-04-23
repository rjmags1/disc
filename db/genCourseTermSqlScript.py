import requests
from bs4 import BeautifulSoup
from random import randrange

# dup in non-py genEnrollment script
YEARS = [2000, 2001, 2002, 2003]
TERM_NAMES = ['Winter', 'Spring', 'Summer', 'Fall']


# get all the h2s from osu cs course catalog that have course titles
r = requests.get('https://catalog.oregonstate.edu/courses/cs/')
htmlDoc = r.text
soup = BeautifulSoup(htmlDoc, 'html.parser')
sampleCourses = soup.find_all("h2", class_="courseblocktitle")


# for extracting info from full course title in h2s
def getFirst2Commas(s):
    commas = 0
    result = []
    for (i, c) in enumerate(s):
        if c == ',':
            commas += 1
            result.append(i)
        if commas == 2:
            break

    return result



# generate tuples of info for sample course sql file creation
tuples = []
getRandomNumSections = lambda: randrange(1, 4)
for h in sampleCourses:
    for s in h.strings:
        s = str(s)
        i, j = getFirst2Commas(s)
        code = s[:i]
        code = code[:2] + code[3:]
        courseName = s[i + 3:j]
        if courseName[0] == '^':
            courseName = courseName[1:]
        if 'H' in code or '*' in courseName or 'SEMINAR' in courseName or \
                'THESIS' in courseName or 'RESEARCH' in courseName: 
            continue

        ### create (name, code, section, year, season) tuples
        for year in YEARS:
            for season in TERM_NAMES:
                sections = getRandomNumSections()
                for sec in range(1, sections + 1):
                    tuples.append((courseName, code, sec, year, season))


# create sample course sql file using generated tuples
templateInsert = """
    INSERT INTO course (
        name,
        code,
        section,
        term)
    VALUES
        ('{name}',
        '{code}',
        {section},
        (SELECT term_id FROM term WHERE year = {year} AND name = '{season}'));
"""

with open("dml.sample.course.sql", "w") as f:
    for name, code, section, year, season in tuples:
        f.write(templateInsert.format(
            name=name, code=code, section=section, year=year, season=season)
        )
        f.write("\n\n")



# create sample terms sql file
templateInsert = """
    INSERT INTO term (
        year,
        name)
    VALUES
        ({year},
        '{season}');
"""

with open('dml.sample.term.sql', 'w') as f:
    for year in YEARS:
        for name in TERM_NAMES:
            f.write(templateInsert.format(year=year, season=name))